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
import { GlobalConfigurationRepository } from '@Repository/global.configuration.repository';

@Injectable()
export class GlobalConfigurationService implements OnModuleInit {
  constructor(private readonly repository: GlobalConfigurationRepository) {}

  onModuleInit() {
    this.getProductViewershipWindowHours().then(
      (value: ApiResponse<number>) => {
        console.log(
          `Setting value for viewershipWindowHours first time$ ${value.data}`,
        );
        StaticConfiguration.viewershipWindowHours = value.data;
      },
    );
  }

  private async get<T>(key: string, defaultValue?: T): Promise<T> {
    const config = await this.repository.findUnique({
      where: { key: key },
    });

    if (config) {
      // Basic type conversion, enhance as needed for complex types
      if (typeof defaultValue === 'number') {
        return Number(config.value) as T;
      }
      return config.value as T;
    }
    throw new NotFoundException(`${key} not found. Please set value via seeed`);
  }

  // A specific getter for viewership hours
  async getProductViewershipWindowHours(): Promise<ApiResponse<number>> {
    if (!StaticConfiguration.viewershipWindowHours) {
      const configValue = await this.get<number>(
        GlobalConfigKeys.PRODUCT_VIEWERSHIP_LAST_SEEN,
        48,
      ); // Default to 48 hours

      return ResponseHelper.CreateResponse<number>(
        '',
        configValue,
        HttpStatus.OK,
      );
    } else {
      console.log(
        `Getting value from cache ${StaticConfiguration.viewershipWindowHours}`,
      );
      return ResponseHelper.CreateResponse<number>(
        '',
        StaticConfiguration.viewershipWindowHours,
        HttpStatus.OK,
      );
    }
  }
}
