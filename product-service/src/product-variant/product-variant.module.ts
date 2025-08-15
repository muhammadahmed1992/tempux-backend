import { Module } from '@nestjs/common';
import { ProductVariantService } from './product-variant.service';
import { ProductVariantRepository } from './product-variant.repository';

@Module({
  providers: [ProductVariantService, ProductVariantRepository],
  exports: [ProductVariantService, ProductVariantRepository],
})
export class ProductVariantModule {}
