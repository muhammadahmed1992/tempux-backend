// global.configuration.service.ts
import { GlobalConfigKeys } from '@Common/enums/global-config-keys';
import { StaticConfiguration } from '@Common/static.configurations.keys';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ProductProxyService } from '@Proxy/product-proxy/product-proxy.service';

@Injectable()
export class GlobalConfigurationService implements OnModuleInit {
  constructor(private readonly productProxyService: ProductProxyService) {}

  async onModuleInit() {
    this.loadInitialConfigs();
  }

  private async loadInitialConfigs() {
    const response = await this.productProxyService.getPlatformCommission();
    // Addding a fallback value
    StaticConfiguration.set(
      GlobalConfigKeys.PLATFORM_COMMISSION,
      response || 6.5,
    );
    console.log(`Configs loaded`, {
      platformCommission: StaticConfiguration.platformCommission,
    });
  }

  async getPlatformCommission(): Promise<number> {
    return StaticConfiguration.platformCommission;
  }
}
