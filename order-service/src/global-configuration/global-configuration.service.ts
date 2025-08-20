// global.configuration.service.ts
import { GlobalConfigKeys } from '@Common/enums/global-config-keys';
import { StaticConfiguration } from '@Common/static.configurations.keys';
import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { GlobalConfigurationRepository } from './global.configuration.repository';

@Injectable()
export class GlobalConfigurationService implements OnModuleInit {
  constructor(private readonly repository: GlobalConfigurationRepository) {}

  async onModuleInit() {
    this.loadInitialConfigs();
  }

  private async loadInitialConfigs() {
    const keys = [GlobalConfigKeys.PLATFORM_COMMISSION];

    const configs = await this.repository.findMany({
      where: { key: { in: keys } },
    });

    if (!configs || configs.length === 0) {
      throw new NotFoundException(`Global configurations not found in DB`);
    }

    // Set values in StaticConfiguration
    configs.forEach((c) => {
      StaticConfiguration.set(c.key, Number(c.value));
    });

    console.log(`Configs loaded`, {
      viewership: StaticConfiguration.platformCommission,
    });
  }

  async getPlatformCommission(): Promise<number> {
    return StaticConfiguration.platformCommission;
  }
}
