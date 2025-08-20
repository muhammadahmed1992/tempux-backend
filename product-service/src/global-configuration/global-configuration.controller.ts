import { Controller, Get } from '@nestjs/common';
import { GlobalConfigurationService } from './global-configuration.service';

@Controller('global-config')
export class GlobalConfigurationController {
  constructor(
    private readonly globalConfigurationService: GlobalConfigurationService,
  ) {}

  @Get('viewership-analytics')
  async viewershipAnalytics() {
    return this.globalConfigurationService.getProductViewershipWindowHours();
  }

  @Get('platform-commission')
  async platformCommission() {
    return this.globalConfigurationService.getProductViewershipWindowHours();
  }
}
