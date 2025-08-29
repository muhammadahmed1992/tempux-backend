import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { CartRepository } from './cart.repository';
import { ProductVariantModule } from '@ProductVariant/product-variant.module';
import { LoggingModule } from '@Common/logging';

@Module({
  imports: [ProductVariantModule, LoggingModule],
  providers: [CartService, CartRepository],
  controllers: [CartController],
})
export class CartModule {}
