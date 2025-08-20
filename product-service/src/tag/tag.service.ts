import { HttpStatus, Injectable } from '@nestjs/common';
import { TagRepository } from './tag.repository';
import ApiResponse from '@Helper/api-response';
import { SetupListingDTO } from '@DTO/setup-listing.dto';
import ResponseHelper from '@Helper/response-helper';
import Constants from '@Helper/constants';
import { ProductAnalyticsRepository } from '@ProductAnalytics/product.analytics.repository';
import { GlobalConfigurationService } from '@GlobalConfiguration/global-configuration.service';
import { GlobalConfigKeys } from '@Common/enums/global-config-keys';
@Injectable()
export class TagService {
  constructor(
    private readonly repository: TagRepository,
    private readonly productAnalyticsRepository: ProductAnalyticsRepository,
    private readonly globalConfiguration: GlobalConfigurationService,
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
      data,
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
    const arrivalID = await this.repository.findFirst({
      where: { key: GlobalConfigKeys.NEW_ARRIVAL },
      select: { id: true },
    });
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(
      sevenDaysAgo.getDate() -
        this.globalConfiguration.getNewArrivalWindowHours(),
    );

    if (arrivalID?.id) {
      const productTags = await this.repository.findByTagId(arrivalID?.id);

      // Instead of deleting one by one in a loop:
      const expiredProductIds = productTags
        .filter((pt) => new Date(pt.created_at) < sevenDaysAgo)
        .map((pt) => pt.product_id);

      if (expiredProductIds.length > 0) {
        await this.repository.removeTags(expiredProductIds, arrivalID?.id);
      } else {
        console.log(`No products found to remove from New Arrival`);
      }
    } else {
      console.warn(
        `Arrival Key is not found in the database while removing. Process is not runned. Please seed data`,
      );
    }
  }

  async markPopularProductsJob(): Promise<void> {
    const popularLastDaysValue =
      this.globalConfiguration.getPopularWindowHours();
    const sinceDate = new Date(
      Date.now() - popularLastDaysValue * 24 * 60 * 60 * 1000,
    );
    const popularID = await this.repository.findFirst({
      where: { key: GlobalConfigKeys.POPULAR },
      select: { id: true },
    });
    if (popularID?.id) {
      const products =
        await this.productAnalyticsRepository.getProductsExceedingViewLimit(
          sinceDate,
          10,
        );
      const pIds = products.map((p) => p.productId);
      await this.repository.addTags(pIds, popularID?.id);
    }
  }

  async markBestSellerTagging(productIds: bigint[]): Promise<boolean> {
    try {
      const bestSellerLastDaysValue =
        this.globalConfiguration.getBestSellerWindowHours();
      const sinceDate = new Date(
        Date.now() - bestSellerLastDaysValue * 24 * 60 * 60 * 1000,
      );
      const bestSellerID = await this.repository.findFirst({
        where: { key: GlobalConfigKeys.BEST_SELLER },
        select: { id: true },
      });
      if (bestSellerID?.id) {
        await this.repository.addTags(productIds, bestSellerID?.id);
      } else {
        console.log('Please define best seller in seed data');
      }
      return Promise.resolve(true);
    } catch (e: any) {
      console.error(e);
      console.log(`Error occurred while tagging best seller.`);
      return Promise.resolve(false);
    }
  }
}
