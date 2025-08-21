import { Module } from '@nestjs/common';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { ShipmentRepository } from './shipment.repository';
import { FedExService } from './fedex/fedex.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [ShippingController],
  providers: [ShippingService, ShipmentRepository, FedExService],
  exports: [ShippingService, ShipmentRepository, FedExService],
})
export class ShippingModule {}
