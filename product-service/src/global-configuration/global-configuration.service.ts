// global.configuration.service.ts
import { GlobalConfigKeys } from '@Common/enums/global-config-keys';
import { StaticConfiguration } from '@Common/static.configurations.keys';
import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { GlobalConfigurationRepository } from './global.configuration.repository';
import { AppLoggerService } from '@Common/logging';

@Injectable()
export class GlobalConfigurationService implements OnModuleInit {
  constructor(
    private readonly repository: GlobalConfigurationRepository,
    private readonly logger: AppLoggerService,
  ) { }

  async onModuleInit() {
    this.loadInitialConfigs();
  }

  private async loadInitialConfigs() {
    const keys = [
      GlobalConfigKeys.PRODUCT_VIEWERSHIP_LAST_SEEN,
      GlobalConfigKeys.NEW_ARRIVAL,
      GlobalConfigKeys.POPULAR,
      GlobalConfigKeys.BEST_SELLER,
      GlobalConfigKeys.PLATFORM_COMMISSION,
    ];

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

    this.logger.info({
      message: `Configs loaded`,
      context: {
        viewership: StaticConfiguration.viewershipWindowHours,
        newArrival: StaticConfiguration.newArrivalWindowHours,
        popular: StaticConfiguration.popularWindowHours,
        bestSeller: StaticConfiguration.bestSellerWindowHours,
        platfromCommission: StaticConfiguration.platformCommission,
      },
    });
  }

  getProductViewershipWindowHours(): number {
    return StaticConfiguration.viewershipWindowHours;
  }

  getNewArrivalWindowHours(): number {
    return StaticConfiguration.newArrivalWindowHours;
  }

  getPopularWindowHours(): number {
    return StaticConfiguration.popularWindowHours;
  }

  getBestSellerWindowHours(): number {
    return StaticConfiguration.bestSellerWindowHours;
  }

  getPlatformCommission(): number {
    return StaticConfiguration.platformCommission;
  }
}
