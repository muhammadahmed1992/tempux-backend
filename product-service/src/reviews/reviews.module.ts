import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { ReviewsRepository } from './reviews.repository';
import { UserProxyModule } from '@Proxy/user-proxy/user-proxy.module';

@Module({
  imports: [UserProxyModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewsRepository],
})
export class ReviewsModule {}
