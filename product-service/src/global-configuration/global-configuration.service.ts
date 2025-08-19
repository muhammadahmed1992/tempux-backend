// global.configuration.service.ts
import { GlobalConfigKeys } from '@Common/enums/global-config-keys';
import { StaticConfiguration } from '@Common/static.configurations.keys';
import ApiResponse from '@Helper/api-response';
import ResponseHelper from '@Helper/response-helper';
import {
  HttpStatus,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { GlobalConfigurationRepository } from './global.configuration.repository';

@Injectable()
export class GlobalConfigurationService implements OnModuleInit {
  constructor(private readonly repository: GlobalConfigurationRepository) {}

  async onModuleInit() {
    this.loadInitialConfigs();
  }

  private async loadInitialConfigs() {
    const keys = [
      GlobalConfigKeys.PRODUCT_VIEWERSHIP_LAST_SEEN,
      GlobalConfigKeys.NEW_ARRIVAL,
      GlobalConfigKeys.POPULAR,
      GlobalConfigKeys.BEST_SELLER,
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

    console.warn(`Configs loaded`, {
      viewership: StaticConfiguration.viewershipWindowHours,
      newArrival: StaticConfiguration.newArrivalWindowHours,
      popular: StaticConfiguration.popularWindowHours,
      bestSeller: StaticConfiguration.bestSellerWindowHours,
    });
  }

  async getConfig<T>(key: string, defaultValue: T): Promise<ApiResponse<T>> {
    const config = await this.repository.findUnique({
      where: { key },
    });

    const value = config
      ? typeof defaultValue === 'number'
        ? (Number(config.value) as T)
        : (config.value as T)
      : defaultValue;

    return ResponseHelper.CreateResponse('', value, HttpStatus.OK);
  }
}
