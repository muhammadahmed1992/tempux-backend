import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { ShippingModule } from '../shipping/shipping.module';
import { ProductProxyModule } from '../proxy/product-proxy/product-proxy.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ShippingModule, ProductProxyModule, PrismaModule],
  controllers: [OrderController],
  providers: [OrderService, OrderRepository],
  exports: [OrderService, OrderRepository],
})
export class OrderModule {}
