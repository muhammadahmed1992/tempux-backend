import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Request, Response, NextFunction } from 'express';
import { IncomingMessage } from 'http';
import { ServiceResolver } from '@Config/service.resolver';
import express from 'express';
import ResponseHelper from '@Common/helper/response-helper';
import Constants from '@Common/helper/constants';
import { Socket } from 'net';
import { Url } from 'url';

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  private proxies: Map<string, any> = new Map();

  constructor(private readonly serviceResolver: ServiceResolver) {}

  use(req: Request, res: Response, next: NextFunction) {
    const [, serviceKey, ...restSegments] = req.originalUrl.split('/');
    const target = this.serviceResolver.getServiceUrl(serviceKey);
    const newPath = '/' + restSegments.join('/');

    console.log('--- Incoming Request ---');
    console.log(`URL: ${req.originalUrl}`);
    console.log(`Mapped Path: ${newPath}`);
    console.log(`Target: ${target}`);
    if (req.body && Object.keys(req.body).length) {
      console.log(`Body:`, req.body);
    }
    console.log('------------------------');

    if (!target) {
      const result = ResponseHelper.CreateResponse<any>(
        Constants.SERVICE_NOT_FOUND,
        null,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
      console.error(`[Proxy] ❌ No service found for key: ${serviceKey}`);
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json(result);
    }

    // 🔹 Use a composite key: serviceKey + path
    const proxyKey = `${serviceKey}:${newPath}`;

    if (!this.proxies.has(proxyKey)) {
      const proxy = createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite: () => {
          console.log(`[Proxy] Rewriting path to: ${newPath}`);
          return newPath;
        },
        on: {
          proxyReq(proxyReq, req: Request) {
            const expressReq = req as express.Request &
              IncomingMessage & { readableBuffer?: Buffer };

            console.log(`[ProxyReq] Preparing request to target: ${target}`);
            console.log(`[ProxyReq] Method: ${req.method} Path: ${newPath}`);

            if (
              expressReq.body &&
              Object.keys(expressReq.body).length &&
              ['POST', 'PUT', 'PATCH'].includes(req.method)
            ) {
              const bodyData = JSON.stringify(expressReq.body);

              proxyReq.setHeader('Content-Type', 'application/json');
              proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
              proxyReq.write(bodyData, (error: any) => {
                if (error)
                  console.error('[ProxyReq] Error writing body:', error);
              });

              console.log('[ProxyReq] Outgoing body:', expressReq.body);
            } else {
              console.log('[ProxyReq] No body to send.');
            }
          },
          proxyRes(proxyRes, req: Request, res: Response) {
            console.log('--- Proxy Response ---');
            console.log(`Target responded for ${req.originalUrl}`);
            console.log(`Status: ${proxyRes.statusCode}`);
            console.log('Headers:', proxyRes.headers);
            console.log('-----------------------');
          },
          error(
            error: Error,
            request: Request,
            response: Response | Socket,
            target?: string | Partial<Url>,
          ) {
            console.error('--- Proxy Error ---');
            console.error(`Incoming Request: ${request.originalUrl}`);
            console.error(
              `Outgoing Request Target: ${
                typeof target === 'string' ? target : target?.host
              }`,
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
              response.writeHead(status, {
                'Content-Type': 'application/json',
              });
              response.end(JSON.stringify(errorPayload));
            } else {
              response.destroy();
            }
          },
        },
      });

      this.proxies.set(proxyKey, proxy);
    }

    console.log(`[Proxy] Forwarding request to: ${target}${newPath}`);
    return this.proxies.get(proxyKey)(req, res, next);
  }
}
