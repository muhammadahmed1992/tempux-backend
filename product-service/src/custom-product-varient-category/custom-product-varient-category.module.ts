import { Module } from '@nestjs/common';
import { CustomProductVariantCategoryService } from './custom-product-varient-category.service';
import { CustomProductVariantCategoryRepository } from './custom-product-category.repository';

@Module({
  providers: [
    CustomProductVariantCategoryService,
    CustomProductVariantCategoryRepository,
  ],
  exports: [CustomProductVariantCategoryService],
})
export class CustomProductCategoryModule {}
