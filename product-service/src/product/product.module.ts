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
import { ProductCreatedListener } from './listener/product-created.listener';
import { LoggingModule } from '@Common/logging';

@Module({
  imports: [
    HashidsModule,
    FavoriteModule,
    ProductVariantModule,
    ProductAnalyticsModule,
    LoggingModule
  ],
  controllers: [ProductController],
  providers: [
    ProductService,
    ProductRepository,
    ProductIdResolver,
    ProductCreatedListener,
  ],
})
export class ProductModule {}
