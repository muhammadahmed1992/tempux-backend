import { Module } from '@nestjs/common';
import { ReviewsService } from '@Services/reviews.service';
import { ReviewsController } from '@Controllers/reviews.controller';
import { UserProxyModule } from '@Proxy/user-proxy/user-proxy.module';
import { ReviewsRepository } from '@Repository/reviews.repository';
import { PrismaService } from '@Services/prisma.service';
import { ProductIdResolver } from '@Resolvers/product-id.resolver';
import { HashidsModule } from '@HashIds/hash-ids.module';

@Module({
  imports: [UserProxyModule, HashidsModule],
  controllers: [ReviewsController],
  providers: [
    PrismaService,
    ReviewsRepository,
    ReviewsService,
    ProductIdResolver,
  ],
})
export class ReviewsModule {}
