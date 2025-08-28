import { Cron, CronExpression } from '@nestjs/schedule';
import { TagService } from './tag.service';
import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../common/logging/logger.service';

@Injectable()
export class TagCleanupJob {
  constructor(
    private readonly tagService: TagService,
    private readonly logger: AppLoggerService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.debug({
      message: 'Started new arrival tagging',
      context: { operation: 'tagging_new_arrival' },
    });
    await this.tagService.cleanupExpiredNewArrivalTags();
    this.logger.debug({
      message: 'Completed new arrival tagging',
      context: { operation: 'tagging_new_arrival' },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handlePopularProductsCron() {
    this.logger.debug({
      message: 'Started Make Popular Tagging',
      context: { operation: 'tagging_popular' },
    });
    await this.tagService.markPopularProductsJob();
    this.logger.debug({
      message: 'Completed Make Popular Tagging',
      context: { operation: 'tagging_popular' },
    });
  }
}
