import { Module } from '@nestjs/common';
import { ListingController } from '@Common/controllers/listing.controller';
import { ListingService } from '@Common/services/listing.service';
import { PrismaModule } from '@Prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ListingController],
  providers: [ListingService],
  exports: [ListingService],
})
export class ListingModule {}
