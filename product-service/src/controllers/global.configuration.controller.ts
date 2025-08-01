import { Controller, Get } from '@nestjs/common';
import { GlobalConfigurationService } from '@Services/global-configuration.service';

@Controller('global-config')
export class GlobalConfigurationController {
  constructor(
    private readonly globalConfigurationService: GlobalConfigurationService,
  ) {}

  @Get('viewership-analytics')
  async viewershipAnalytics() {
    return this.globalConfigurationService.getProductViewershipWindowHours();
  }
}
