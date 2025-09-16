import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { CartRepository } from './cart.repository';
import { LoggingModule } from '@Common/logging';
import { ProductItemModule } from '@ProductItem/product-item.module';

@Module({
  imports: [LoggingModule,ProductItemModule],
  providers: [CartService, CartRepository],
  controllers: [CartController],
})
export class CartModule {}
