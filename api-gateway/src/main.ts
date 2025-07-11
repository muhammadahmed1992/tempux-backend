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
  app.use(pattern, new ProxyMiddleware().use);
  app.useGlobalInterceptors(new ResponseHandlerInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
