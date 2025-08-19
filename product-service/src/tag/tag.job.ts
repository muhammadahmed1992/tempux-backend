import { Cron, CronExpression } from '@nestjs/schedule';
import { TagService } from './tag.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TagCleanupJob {
  constructor(private readonly tagService: TagService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    console.log('Started new arrival tagging');
    await this.tagService.cleanupExpiredNewArrivalTags();
    console.log('Completed new arrival tagging');
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handlePopularProductsCron() {
    console.log('Started Make Popular Tagging');
    await this.tagService.markPopularProductsJob();
    console.log('Completed Make Popular Tagging');
  }
}
