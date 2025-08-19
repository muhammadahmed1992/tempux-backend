import { HttpStatus, Injectable } from '@nestjs/common';
import { TagRepository } from './tag.repository';
import ApiResponse from '@Helper/api-response';
import { SetupListingDTO } from '@DTO/setup-listing.dto';
import ResponseHelper from '@Helper/response-helper';
import Constants from '@Helper/constants';
import { ProductAnalyticsRepository } from '@ProductAnalytics/product.analytics.repository';
@Injectable()
export class TagService {
  constructor(
    private readonly repository: TagRepository,
    private readonly productAnalyticsRepository: ProductAnalyticsRepository,
  ) {}
  async getAllPagedData(
    pageNumber: number,
    pageSize: number,
    order?: object,
    where?: object,
    select?: object,
  ): Promise<ApiResponse<SetupListingDTO[]>> {
    const { data, totalCount } = await this.repository.findManyPaginated(
      pageNumber,
      pageSize,
      where,
      select,
      order,
    );
    return ResponseHelper.CreateResponse<SetupListingDTO[]>(
      Constants.DATA_SUCCESS,
      data.map((tag) => ({
        title: tag.name,
        id: tag.id,
        description: tag.description,
        created_at: tag.created_at,
        updated_at: tag.updated_at,
      })),
      HttpStatus.OK,
      {
        pageNumber,
        pageSize,
        totalCount,
        numberOfTotalPages: Math.ceil(totalCount / pageSize),
      },
    );
  }

  async cleanupExpiredNewArrivalTags(): Promise<void> {
    const NEW_ARRIVAL_TAG_ID = 1;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const productTags = await this.repository.findByTagId(NEW_ARRIVAL_TAG_ID);

    for (const pt of productTags) {
      if (new Date(pt.created_at) < sevenDaysAgo) {
        await this.repository.removeTag(pt.id);
      }
    }
  }

  async markPopularProductsJob(limit = 10): Promise<void> {
    const POPULAR_ARRIVAL_TAG_ID = 9;
    const products =
      await this.productAnalyticsRepository.getProductsExceedingViewLimit(
        limit,
      );

    for (const pt of products) {
      await this.repository.addTag(pt.productId, POPULAR_ARRIVAL_TAG_ID);
    }
  }
}
