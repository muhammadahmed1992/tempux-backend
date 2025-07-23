import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ServiceResolver } from "@Config/service.resolver";
import { ProxyMiddleware } from "./middleware/proxy-middleware";

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ServiceResolver, ProxyMiddleware],
})
export class AppModule {}
