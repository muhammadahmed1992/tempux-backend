import { Module } from '@nestjs/common';
import { ProductItemService } from './product-item.service';
import { ProductItemRepository } from './product-item.repository';

@Module({
  providers: [ProductItemService, ProductItemRepository],
  exports: [ProductItemService, ProductItemRepository],
})
export class ProductItemModule {}
