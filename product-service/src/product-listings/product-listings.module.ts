import { Module } from '@nestjs/common';
import { ProductListingsService } from './product-listings.service';
import { ProductListingsController } from './product-listings.controller';
import { PrismaService } from '@Prisma/prisma.service';

@Module({
  providers: [ProductListingsService, PrismaService],
  controllers: [ProductListingsController],
})
export class ProductListingsModule {}
