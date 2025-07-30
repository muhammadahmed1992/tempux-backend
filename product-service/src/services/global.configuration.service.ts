import { Injectable, NotFoundException } from '@nestjs/common';
import { GlobalConfigurationRepository } from '@Repository/global.configuration.repository';

@Injectable()
export class GlobalConfigurationService {
  constructor(private readonly repository: GlobalConfigurationRepository) {}

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
  async getProductViewershipWindowHours(): Promise<number> {
    const configValue = await this.get<number>(
      'PRODUCT_VIEWERSHIP_LAST_SEEN',
      48,
    ); // Default to 48 hours
    return configValue;
  }
}
