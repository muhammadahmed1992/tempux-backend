// global.configuration.service.ts
import { GlobalConfigKeys } from '@Common/enums/global-config-keys';
import { StaticConfiguration } from '@Common/static.configurations.keys';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ProductProxyService } from '@Proxy/product-proxy/product-proxy.service';
import { AppLoggerService } from '@Common/logging';
import { context } from '@opentelemetry/api';

@Injectable()
export class GlobalConfigurationService implements OnModuleInit {
  constructor(
    private readonly productProxyService: ProductProxyService,
    private readonly logger: AppLoggerService,
  ) { }

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
    this.logger.info({
      message: 'Configs loaded, Platform Commision:',
      context: {
        platformCommission: StaticConfiguration.platformCommission,
      },
    });
  }

  async getPlatformCommission(): Promise<number> {
    return StaticConfiguration.platformCommission;
  }
}
