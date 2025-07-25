import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ProxyMiddleware } from "./middleware/proxy-middleware";
import Utils from "@Common/utils";
import express from "express";
import ResponseHandlerInterceptor from "./interceptor/response-handler.interceptor";
import { AllExceptionsFilter } from "./filters/global.exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // TODO: Need to upgrade this logic... Maybe use any cloud service i.e AWS Service Discovery etc.
  const pattern = Utils.ReturnServicePaths();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.enableCors({
    origin: (origin: any, callback: any) => {
      // This function dynamically reflects the origin, effectively allowing all.
      // It satisfies the CORS specification requirement for 'credentials: true'
      // by not using the '*' wildcard for the 'Access-Control-Allow-Origin' header,
      // but instead setting it to the actual requesting origin.
      callback(null, true);
    },
    methods: "*", // Explicitly allow all common HTTP methods
    allowedHeaders:
      "Content-Type, Accept, Authorization, X-Requested-With, X-Api-Key", // Explicitly list headers
    credentials: true, // Allow cookies and authorization headers to be sent
  });
  const proxyMiddlewareInstance = app.get(ProxyMiddleware);
  app.use(pattern, proxyMiddlewareInstance.use.bind(proxyMiddlewareInstance));
  app.useGlobalInterceptors(new ResponseHandlerInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(3000);
}
bootstrap();
