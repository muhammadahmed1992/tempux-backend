import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaService } from "@Services/prisma.service";
import { RepositoryModule } from "@Module/repository.module";
import { BaseService } from "@Services/base.services";
import { BrandService } from "@Services/brand.service";

@Module({
  imports: [RepositoryModule],
  controllers: [AppController],
  providers: [AppService, PrismaService, BaseService, BrandService],
})
export class AppModule {}
