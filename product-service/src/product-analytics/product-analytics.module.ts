import { Module } from '@nestjs/common';
import { ProductAnalyticsService } from './product-analytics.service';
import { ProductAnalyticsRepository } from './product.analytics.repository';
import { GlobalConfigurationModule } from '@GlobalConfiguration/global-configuration.module';

@Module({
  imports: [GlobalConfigurationModule],
  providers: [ProductAnalyticsService, ProductAnalyticsRepository],
  exports: [ProductAnalyticsService],
})
export class ProductAnalyticsModule {}
