import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ProxyMiddleware } from "./middleware/proxy-middleware";
import Utils from "@Common/utils";
import * as express from "express";
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // TODO: Need to upgrade this logic...
  const pattern = Utils.ReturnServicePaths();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(pattern, new ProxyMiddleware().use);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
