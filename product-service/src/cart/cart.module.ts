import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { CartRepository } from './cart.repository';
import { LoggingModule } from '@Common/logging';
import { ProductService } from '@Product/product.service';
import { ProductAnalyticsModule } from '@ProductAnalytics/product-analytics.module';
import { ProductRepository } from '@Product/product.repository';
import { SlugModule } from 'src/slug/slug.module';
import { SlugService } from 'src/slug/slug.service';
import { ProductValidationService } from '@Product/product-validation.service';
import { ProductAttributesService } from 'src/product-attributes/product-attributes.service';
import { ImageUploadService } from 'src/image-upload/image-upload.service';


@Module({
  imports: [LoggingModule, ProductAnalyticsModule, SlugModule],
  providers: [CartService, CartRepository, ProductService, ProductRepository, SlugService, ProductValidationService, ProductAttributesService, ImageUploadService],
  controllers: [CartController],
})
export class CartModule {}
