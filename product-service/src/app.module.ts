import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from '@Auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { SlugModule } from './slug/slug.module';
import { FavoriteModule } from './favorite/favorite.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductAnalyticsModule } from './product-analytics/product-analytics.module';
import { ProductVariantModule } from './product-variant/product-variant.module';
import { ReviewsModule } from '@Reviews/reviews.module';
import { GenderModule } from './gender/gender.module';
import { SizeModule } from '@Size/size.module';
import { GlobalConfigurationModule } from '@GlobalConfiguration/global-configuration.module';
import { ColorModule } from '@Color/color.module';
import { CategoryModule } from '@Category/category.module';
import { CartController } from '@Cart/cart.controller';
import { CartModule } from '@Cart/cart.module';
import { BrandModule } from '@Brand/brand.module';
import { ProductModule } from '@Product/product.module';
import { CollectionModule } from './collection/collection.module';
import { HeaderAuthMiddleware } from '@Auth/middleware/header-auth.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    ReviewsModule,
    ColorModule,
    CategoryModule,
    CartModule,
    BrandModule,
    PrismaModule,
    ProductModule,
    ReviewsModule,
    SizeModule,
    GenderModule,
    PrismaModule,
    CollectionModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HeaderAuthMiddleware).forRoutes('*');
  }
}
