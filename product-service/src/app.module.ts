import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
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
import { ParseQueryPipe } from '@Common/pipes/parse-query.pipe';
import { APP_PIPE } from '@nestjs/core';
import { HashidsModule } from '@HashIds/hash-ids.module';
import { TagModule } from './tag/tag.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
    HashidsModule,
    TagModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ParseQueryPipe,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply().forRoutes('*');
  }
}
