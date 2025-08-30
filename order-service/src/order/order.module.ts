import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { ShippingModule } from '../shipping/shipping.module';
import { ProductProxyModule } from '../proxy/product-proxy/product-proxy.module';
import { AuthProxyModule } from '../proxy/auth-proxy/auth-proxy.module';
import { PrismaModule } from '../prisma/prisma.module';
import { LoggingModule } from '../common/logging';

@Module({
  imports: [
    ShippingModule,
    ProductProxyModule,
    AuthProxyModule,
    PrismaModule,
    LoggingModule,
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderRepository],
  exports: [OrderService, OrderRepository],
})
export class OrderModule {}
