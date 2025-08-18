import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from './product.repository';
import { ProductVariantModule } from '@ProductVariant/product-variant.module';
import { ProductAnalyticsModule } from '@ProductAnalytics/product-analytics.module';
import { ParseQueryPipe } from '@Common/pipes/parse-query.pipe';
import { APP_PIPE } from '@nestjs/core';
import { ParseProductIdPipe } from '@Pipes/parse-product-id.pipe';
import { ProductIdResolver } from '@Common/resolver/product-id.resolver';
import { HashidsModule } from '../hash-ids/hash-ids.module';
import { FavoriteModule } from '@Favorite/favorite.module';

@Module({
  imports: [
    HashidsModule,
    FavoriteModule,
    ProductVariantModule,
    ProductAnalyticsModule,
  ],
  controllers: [ProductController],
  providers: [
    ProductService,
    ProductRepository,
    {
      provide: APP_PIPE,
      useClass: ParseQueryPipe,
    },
    ProductIdResolver,
  ],
})
export class ProductModule {}
