import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ServiceResolver } from "@Config/service.resolver";

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ServiceResolver],
})
export class AppModule {}
