import { GetAllQueryDTO } from '@DTO/get-all-query.dto';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TagService } from './tag.service';
import { AppLoggerService } from '../common/logging/logger.service';

@Controller('tag')
export class TagController {
  constructor(
    private readonly tagService: TagService,
    private readonly logger: AppLoggerService,
  ) {}

  @Get()
  async getAll(@Query() query: GetAllQueryDTO) {
    const { page, pageSize, orderBy, where, select } = query;
    return this.tagService.getAllPagedData(
      page,
      pageSize,
      orderBy,
      where,
      select,
    );
  }

  @Post('tagging-best-seller')
  async taggingBestSeller(@Body() payload: { productIds: number[] }) {
    this.logger.info({
      message: 'In tag controller taggingBestSeller',
      context: { operation: 'tagging_best_seller', payload },
    });
    const convertedProductIds = payload.productIds.map((productId) =>
      BigInt(productId),
    );
    return this.tagService.markBestSellerTagging(convertedProductIds);
  }
}
