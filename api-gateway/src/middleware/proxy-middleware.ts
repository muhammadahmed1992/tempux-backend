import { Injectable, NestMiddleware } from "@nestjs/common";
import { createProxyMiddleware } from "http-proxy-middleware";
import { Request, Response, NextFunction } from "express";
import { IncomingMessage } from "http";
import { ServiceResolver } from "@API-Gateway/config/service.resolver";
import * as express from "express";
@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Parse first path segment: /auth/register => auth
    const [, serviceKey, ...restSegments] = req.originalUrl.split("/");
    const target = ServiceResolver.getServiceUrl(serviceKey);
    const newPath = "/" + restSegments.join("/");

    if (!target) {
      return res.status(502).json({ error: "Unknown service" });
    }

    console.log("Incoming:", req.originalUrl);
    console.log(`target: ${target}`);
    console.log("Resolved service:", serviceKey, " → ", target);
    console.log(`new path: ${newPath}`);
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
          if (
            expressReq.body &&
            Object.keys(expressReq.body).length &&
            ["POST", "PUT", "PATCH"].includes(req.method)
          ) {
            const bodyData = JSON.stringify(expressReq.body);

            proxyReq.setHeader("Content-Type", "application/json");
            proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
            proxyReq.end();
            // --- Debugging Logs (Outgoing Proxy Request) ---
            console.log(
              "--- Outgoing ProxyReq Headers (after body processing) ---"
            );
            console.log(
              "Content-Type (on proxyReq):",
              proxyReq.getHeader("Content-Type")
            );
            console.log(
              "Content-Length (on proxyReq):",
              proxyReq.getHeader("Content-Length")
            );
            console.log(
              "---------------------------------------------------------"
            );

            // Add listeners to the proxyReq for debugging stream completion
            proxyReq.on("error", (err) => {
              console.error("ProxyReq Error:", err);
            });
            proxyReq.on("close", () => {
              console.log(
                "ProxyReq Closed (connection to target server closed)"
              );
            });
            proxyReq.on("finish", () => {
              console.log(
                "ProxyReq Finished (all data written to target server)"
              );
            });
          } else if (
            expressReq.method === "GET" ||
            expressReq.method === "HEAD"
          ) {
            // For GET/HEAD requests, no body is expected
            proxyReq.end(); // End the proxy request
          } else {
            // For other methods or if body is unexpectedly missing,
            // you might want to log a warning or handle differently.
            console.warn(
              `Unhandled method or missing body for ${expressReq.method} request.`
            );
            proxyReq.end();
          }
        },
        proxyRes() {
          // proxyRes, req, res
          // TODO: Will investigate later
        },
        error(error, request, response, target) {
          console.error(request);
          console.error(target);
          console.error("Proxy error:", error);
          response.end(
            JSON.stringify({ error: "Proxy error", details: error.message })
          );
        },
      },
    });

    return proxy(req, res, next);
  }
}
