import { Module } from "@nestjs/common";
import { ReviewsService } from "@Services/reviews.service";
import { ReviewsController } from "@Controllers/reviews.controller";
import { UserProxyModule } from "@Proxy/user-proxy/user-proxy.module";
import { ReviewsRepository } from "@Repository/reviews.repository";
import { PrismaClient } from "@prisma/client";

@Module({
  imports: [UserProxyModule],
  controllers: [ReviewsController],
  providers: [PrismaClient, ReviewsRepository, ReviewsService],
})
export class ReviewsModule {}
