import { Module } from '@nestjs/common';
import { ProductProxyService } from './product-proxy.service';

@Module({
  providers: [ProductProxyService],
  exports: [ProductProxyService],
})
export class ProductProxyModule {}
