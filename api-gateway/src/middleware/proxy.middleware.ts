import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';
import type { Request, Response, NextFunction } from 'express';
import type { IncomingMessage } from 'http';
import express from 'express';
import { Socket } from 'net';
import { Url } from 'url';

import { ServiceResolver } from '@Config/service.resolver';
import ResponseHelper from '@Common/helper/response-helper';
import Constants from '@Common/helper/constants';
import Utils from '@Common/utils';

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  // Single proxy instance reused for all microservices
  private readonly proxy: ReturnType<typeof createProxyMiddleware>;

  constructor(private readonly serviceResolver: ServiceResolver) {
    this.proxy = createProxyMiddleware({
      // A default target is required, but it will be overridden by `router` each time.
      target: 'http://localhost',
      changeOrigin: true,
      xfwd: true,
      ws: true,
      proxyTimeout: 30_000,
      timeout: 30_000,

      /**
       * Resolve the upstream target **per request**.
       * Runs on every call, so target never goes stale.
       */
      router: (req: Request) => {
        const [, serviceKey] = req.originalUrl.split('/');
        return this.serviceResolver.getServiceUrl(serviceKey);
      },

      /**
       * Rewrite the path **per request**.
       * Example: /auth/user/login -> /user/login
       */
      pathRewrite: (path, req: Request) => {
        const [, , ...rest] = req.originalUrl.split('/');
        const newPath = '/' + rest.join('/');
        // Optional debug header to prove it’s per-request
        (req as any)._rewrittenPath = newPath;
        return newPath;
      },

      on: {
        proxyReq: (proxyReq, req: Request & IncomingMessage) => {
          // Attach helpful debug headers
          try {
            if ((req as any)._rewrittenPath) {
              proxyReq.setHeader(
                'x-proxy-rewrite',
                (req as any)._rewrittenPath,
              );
            }
            const [, serviceKey] = req.originalUrl.split('/');
            proxyReq.setHeader('x-proxy-service', serviceKey || 'unknown');
          } catch {}

          // Safely forward JSON bodies if Express has already parsed them.
          const hasBody =
            (req as unknown as express.Request).body &&
            Object.keys((req as any).body).length > 0 &&
            ['POST', 'PUT', 'PATCH'].includes(req.method);

          if (!hasBody) return;

          // Only re-serialize JSON; don't break multipart/uploads.
          const reqContentType = (req.headers['content-type'] || '')
            .toString()
            .toLowerCase();
          if (reqContentType.includes('application/json')) {
            const bodyData = JSON.stringify((req as any).body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
          } else if (
            reqContentType.includes('application/x-www-form-urlencoded')
          ) {
            const params = new URLSearchParams((req as any).body).toString();
            proxyReq.setHeader(
              'Content-Type',
              'application/x-www-form-urlencoded',
            );
            proxyReq.setHeader('Content-Length', Buffer.byteLength(params));
            proxyReq.write(params);
          } else {
            // For multipart/form-data or others, prefer placing the proxy BEFORE body parsers.
            // Here we just avoid rewriting to not corrupt the stream.
            // You can log a warning if needed.
          }
        },

        proxyRes: (proxyRes, req: Request, _res: Response) => {
          const [, serviceKey] = req.originalUrl.split('/');
          // Minimal, useful logging
          console.log(
            `[ProxyRes] ${serviceKey} ${req.method} ${req.originalUrl} -> ${proxyRes.statusCode}`,
          );
        },

        error: (
          error: Error,
          request: Request,
          response: Response | Socket,
          target?: string | Partial<Url>,
        ) => {
          const [, serviceKey] = request.originalUrl.split('/');
          console.error('--- Proxy Error ---');
          console.error(`Service: ${serviceKey}`);
          console.error(`Incoming: ${request.method} ${request.originalUrl}`);
          console.error(
            `Target: ${typeof target === 'string' ? target : target?.host}`,
          );
          console.error('Error:', error);
          console.error('---------------------');

          const status = HttpStatus.SERVICE_UNAVAILABLE;
          const message = `Proxy Error: Could not reach target service. ${error.message}`;
          const errorPayload = {
            statusCode: status,
            data: {
              timestamp: new Date().toISOString(),
              path: request.originalUrl,
              targetService: target,
              error: error.name || 'ProxyServiceError',
            },
            message,
          };

          if (!(response instanceof Socket)) {
            (response as Response)
              .status(status)
              .header('Content-Type', 'application/json')
              .send(JSON.stringify(errorPayload));
          } else {
            (response as Socket).destroy();
          }
        },
      },
    }) as any;
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Only proxy known microservice routes
    if (!Utils.ReturnServicePaths().test(req.originalUrl)) {
      return next();
    }

    // Validate service exists before invoking proxy (so router won’t get undefined)
    const [, serviceKey] = req.originalUrl.split('/');
    const target = this.serviceResolver.getServiceUrl(serviceKey);

    if (!target) {
      const result = ResponseHelper.CreateResponse<any>(
        Constants.SERVICE_NOT_FOUND,
        null,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
      console.error(`[Proxy] ❌ No service found for key: ${serviceKey}`);
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json(result);
    }

    console.log(
      `[Proxy] -> ${serviceKey} | ${req.method} ${req.originalUrl} -> ${target}`,
    );
    return this.proxy(req, res, next);
  }
}
