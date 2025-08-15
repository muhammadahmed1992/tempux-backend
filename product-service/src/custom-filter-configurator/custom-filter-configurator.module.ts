import { Module } from '@nestjs/common';
import { CustomFilterConfiguratorService } from './custom-filter-configurator.service';
import { CustomFilterConfiguratorRepository } from './custom-filter-configurator.repository';
import { PrismaService } from '@Prisma/prisma.service';

@Module({
  providers: [
    CustomFilterConfiguratorService,
    CustomFilterConfiguratorRepository,
  ],
  exports: [
    CustomFilterConfiguratorService,
    CustomFilterConfiguratorRepository,
  ],
})
export class CustomFilterConfigurationModule {}
