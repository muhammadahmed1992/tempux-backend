import { Module } from '@nestjs/common';
import { ProductAttributesController } from './product-attributes.controller';
import { ProductAttributesService } from './product-attributes.service';
import { ProductValidationService } from '@Product/product-validation.service';
import { SlugService } from 'src/slug/slug.service';

@Module({
  imports: [],
  controllers: [ProductAttributesController],
  providers: [ProductAttributesService, ProductValidationService, SlugService],
})
export class ProductAttributesModule {}
