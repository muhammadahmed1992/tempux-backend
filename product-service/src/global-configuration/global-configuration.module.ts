import { Module } from '@nestjs/common';
import { GlobalConfigurationController } from './global-configuration.controller';
import { GlobalConfigurationService } from './global-configuration.service';
import { GlobalConfigurationRepository } from './global.configuration.repository';

@Module({
  controllers: [GlobalConfigurationController],
  providers: [GlobalConfigurationService, GlobalConfigurationRepository],
  exports: [GlobalConfigurationService, GlobalConfigurationRepository],
})
export class GlobalConfigurationModule {}
