import { Module } from "@nestjs/common";
import { ReviewsService } from "@Services/reviews.service";
import { ReviewsController } from "@Controllers/reviews.controller";
import { UserProxyModule } from "@Proxy/user-proxy/user-proxy.module"; // Import the new module
import { ReviewsRepository } from "@Repository/reviews.repository";

@Module({
  imports: [UserProxyModule],
  controllers: [ReviewsController],
  providers: [ReviewsRepository, ReviewsService],
})
export class ReviewsModule {}
