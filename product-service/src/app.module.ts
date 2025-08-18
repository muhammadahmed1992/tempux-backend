import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from '@Auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ReviewsModule } from '@Reviews/reviews.module';
import { GenderModule } from './gender/gender.module';
import { SizeModule } from '@Size/size.module';
import { ColorModule } from '@Color/color.module';
import { CategoryModule } from '@Category/category.module';
import { CartModule } from '@Cart/cart.module';
import { BrandModule } from '@Brand/brand.module';
import { ProductModule } from '@Product/product.module';
import { ModelModule } from './model/model.module';
import { SearchModule } from './search/search.module';
import { ListingModule } from './common/modules/listing.module';
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
    ModelModule,
    SearchModule,
    ListingModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HeaderAuthMiddleware).forRoutes('*');
  }
}
