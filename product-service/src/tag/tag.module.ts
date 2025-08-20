import { Module } from '@nestjs/common';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { TagRepository } from './tag.repository';
import { TagCleanupJob } from './tag.job';
import { GlobalConfigurationModule } from '@GlobalConfiguration/global-configuration.module';
import { ProductAnalyticsModule } from '@ProductAnalytics/product-analytics.module';

@Module({
  imports: [GlobalConfigurationModule, ProductAnalyticsModule],
  controllers: [TagController],
  providers: [TagService, TagRepository, TagCleanupJob],
})
export class TagModule {}
