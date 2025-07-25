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
  constructor(private readonly serviceResolver: ServiceResolver) {}
  use(req: Request, res: Response, next: NextFunction) {
    // Parse first path segment: /auth/register => auth
    const [, serviceKey, ...restSegments] = req.originalUrl.split('/');
    const target = this.serviceResolver.getServiceUrl(serviceKey);
    const newPath = '/' + restSegments.join('/');

    if (!target) {
      const result = ResponseHelper.CreateResponse<any>(
        Constants.SERVICE_NOT_FOUND,
        null,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json(result);
    }
    const proxy = createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: () => {
        return newPath;
      },
      on: {
        proxyReq(proxyReq, req: Request) {
          // TODO: will update it later
          // Cast 'req' to 'express.Request' to access Express-specific properties
          // and to 'IncomingMessage' to access stream-related properties.
          // Note: 'readableBuffer' is often an internal property, so direct access
          // might not be fully type-safe without custom type augmentations.
          const expressReq = req as express.Request &
            IncomingMessage & { readableBuffer?: Buffer };
          console.log(`Logging the incoming request method: ${req.method}`);
          if (
            expressReq.body &&
            Object.keys(expressReq.body).length &&
            ['POST', 'PUT', 'PATCH'].includes(req.method)
          ) {
            const bodyData = JSON.stringify(expressReq.body);

            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
            //proxyReq.end();
            // --- Debugging Logs (Outgoing Proxy Request) ---
            console.log(
              '--- Outgoing ProxyReq Headers (after body processing) ---',
            );
            console.log(
              'Content-Type (on proxyReq):',
              proxyReq.getHeader('Content-Type'),
            );
            console.log(
              'Content-Length (on proxyReq):',
              proxyReq.getHeader('Content-Length'),
            );
            console.log(
              '---------------------------------------------------------',
            );

            // Add listeners to the proxyReq for debugging stream completion
            proxyReq.on('error', (err) => {
              console.error('ProxyReq Error:', err);
            });
            proxyReq.on('close', () => {
              console.log(
                'ProxyReq Closed (connection to target server closed)',
              );
            });
            proxyReq.on('finish', () => {
              console.log(
                'ProxyReq Finished (all data written to target server)',
              );
            });
          } else {
            // For other methods or if body is unexpectedly missing,
            // you might want to log a warning or handle differently.
            console.warn(
              `Unhandled method or missing body for ${expressReq.method} request.`,
            );
          }
        },
        proxyRes(proxyRes, req: Request, res: Response) {
          // proxyRes, req, res
          // TODO: Will investigate later
          console.log('API Gateway proxy response');
          console.log(proxyRes.originalUrl);
          console.log(req.url);
          console.log(res.statusCode);
        },
        error(
          error: Error,
          request: Request,
          response: Response | Socket,
          target?: string | Partial<Url>,
        ) {
          console.error(`Incoming Request: ${request.originalUrl}`);
          console.error(
            `Outgoing Request: ${typeof target === 'string' ? target : target?.host}`,
          );
          console.error(Constants.PROXY_ERROR, error);
          // throw new HttpException(
          //   {
          //     message: `Proxy Error: Could not reach target service. ${error.message}`,
          //     error: error.message,
          //     target: target,
          //     originalUrl: request.originalUrl,
          //   },
          //   HttpStatus.BAD_GATEWAY
          // );
          const status = HttpStatus.SERVICE_UNAVAILABLE; // Or HttpStatus.BAD_GATEWAY
          const message = `Proxy Error: Could not reach target service. ${error.message}`;
          const errorPayload = {
            statusCode: status,
            data: {
              timestamp: new Date().toISOString(),
              path: request.originalUrl,
              targetService: target,
              error: error.name || 'ProxyServiceError', // e.g., 'ECONNREFUSED'
            },
            message: message,
            // You can add more context here if needed, e.g., correlationId
          };

          // Ensure the response is sent as JSON
          if (!(response instanceof Socket)) {
            response.writeHead(status, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify(errorPayload));
          } else {
            response.destroy();
          }
        },
      },
    });

    return proxy(req, res, next);
  }
}
