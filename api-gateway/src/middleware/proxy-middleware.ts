import { Injectable, NestMiddleware } from "@nestjs/common";
import { createProxyMiddleware } from "http-proxy-middleware";
import { Request, Response, NextFunction } from "express";
import { IncomingMessage, ServerResponse } from "http";
import { Socket } from "net";
import { ProxyTargetUrl } from "http-proxy";
import { ServiceResolver } from "@API-Gateway/config/service.resolver";

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const segments = req.originalUrl.split("/").filter((url) => url);
    const serviceKey = segments[0];
    const target = ServiceResolver.getServiceUrl(serviceKey);

    if (!target) {
      return res.status(502).json({ error: "Unknown service" });
    }

    const remainingPath = "/" + segments.slice(1).join("/");
    console.log(remainingPath);
    const proxy = createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: (path) => {
        // Remove the service prefix like "/product/..."
        return remainingPath;
      },
      on: {
        proxyReq(proxyReq, req, res) {
          // Add custom header
          proxyReq.setHeader("X-Gateway", "MyGateway");
        },

        proxyRes(proxyRes, req, res) {
          if (proxyRes.statusCode === 404) {
            console.error(`404 from target: ${req.url}`);
          }
        },
        error(
          error: Error,
          request: IncomingMessage,
          res: ServerResponse<IncomingMessage> | Socket,
          target?: ProxyTargetUrl | undefined
        ) {
          // TODO: Ahmed (This block will only get called if we are unable to make call to this service i.e timeout or maybe it is down)
          console.log(error);
          console.log(request);
          console.log(res);
          console.log(target);
        },
      },
    });

    return proxy(req, res, next);
  }
}
