import { Module } from '@nestjs/common';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { TagRepository } from './tag.repository';
import { TagCleanupJob } from './tag.job';
import { ProductAnalyticsRepository } from '@ProductAnalytics/product.analytics.repository';

@Module({
  controllers: [TagController],
  providers: [
    TagService,
    TagRepository,
    TagCleanupJob,
    ProductAnalyticsRepository,
  ],
})
export class TagModule {}
