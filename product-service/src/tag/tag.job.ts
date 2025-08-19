import { Cron, CronExpression } from '@nestjs/schedule';
import { TagService } from './tag.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TagCleanupJob {
  constructor(private readonly tagService: TagService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    await this.tagService.cleanupExpiredNewArrivalTags();
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handlePopularProductsCron() {
    await this.tagService.markPopularProductsJob();
  }
}
