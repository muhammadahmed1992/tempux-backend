import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { RepositoryModule } from '@Module/repository.module';
import { BrandService } from '@Services/brand.service';
import { BrandController } from '@Controllers/brand.controller';
import { TypeController } from '@Controllers/type.controller';
import { CategoryController } from '@Controllers/category.controller';
import { SizeController } from '@Controllers/size.controller';
import { ColorController } from '@Controllers/color.controller';
import { TypesService } from '@Services/types.service';
import { CategoryService } from '@Services/category.service';
import { ColorService } from '@Services/color.service';
import { SizeService } from '@Services/size.service';
import { AuthModule } from '@Module/auth.module';
import { ReviewsModule } from '@Module/reviews.module';
import { ProductService } from '@Services/product.service';
import { ProductController } from '@Controllers/product.controller';
import { ProductVariantService } from '@Services/product-variant.service';
import { CustomFilterConfiguratorService } from '@Services/custom-filter-configurator.service';
import { CustomProductVariantCategoryService } from '@Services/custom-product-category.service';
import { FavoriteService } from '@Services/favorite.service';
import { CartService } from '@Services/cart.service';
import { CartController } from '@Controllers/cart.controller';
import { ConfigModule } from '@nestjs/config';
import { SlugModule } from './slug/slug.module';
import { HashidsModule } from './hash-ids/hash-ids.module';
import { GlobalConfigurationService } from '@Services/global-configuration.service';
import { ProductAnalyticsService } from '@Services/product-analytics.service';
import { GlobalConfigurationController } from '@Controllers/global.configuration.controller';
import { ParseQueryPipe } from '@Common/pipes/parse-query.pipe';
import { APP_PIPE } from '@nestjs/core';
import { ParseProductIdPipe } from '@Pipes/parse-product-id.pipe';
import { ProductIdResolver } from '@Common/resolver/product-id.resolver';
import { ParseAddToCartPipe } from '@Common/pipes/parse-add-to-cart-dto.pipe';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RepositoryModule,
    AuthModule,
    ReviewsModule,
    SlugModule,
    HashidsModule,
  ],
  controllers: [
    AppController,
    BrandController,
    TypeController,
    CategoryController,
    SizeController,
    ColorController,
    ProductController,
    CartController,
    GlobalConfigurationController,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ParseQueryPipe,
    },
    BrandService,
    TypesService,
    CategoryService,
    ColorService,
    SizeService,
    ProductService,
    ProductVariantService,
    CustomFilterConfiguratorService,
    CustomProductVariantCategoryService,
    FavoriteService,
    CartService,
    GlobalConfigurationService,
    ProductAnalyticsService,
    ProductIdResolver,
    ParseProductIdPipe,
  ],
})
export class AppModule {}
