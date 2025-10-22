import ApiResponse from '@Helper/api-response';
import ResponseHelper from '@Helper/response-helper';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ProductAnalyticsRepository } from './product.analytics.repository';
import { GlobalConfigurationService } from '@GlobalConfiguration/global-configuration.service';
import { StaticConfiguration } from '@Common/static.configurations.keys';

@Injectable()
export class ProductAnalyticsService {
  constructor(
    private readonly globalConfigService: GlobalConfigurationService,
    private readonly repository: ProductAnalyticsRepository,
  ) {}

  /**
   * Records a unique product view for a logged-in user within a configured time window.
   * If the user has already viewed this product within the window, no new record is created.
   *
   * @param userId The ID of the logged-in user.
   * @param productId The ID of the product.
   * @param auditorId The ID of the user performing the action (usually same as userId).
   */
  async recordProductView(
    userId: bigint,
    productId: bigint,
    auditorId: bigint,
  ): Promise<ApiResponse<boolean>> {
    // 1. Get the configured time window for unique viewership
    const viewershipWindowHours =
      this.globalConfigService.getProductViewershipWindowHours();

    // 2. Calculate the cutoff time for considering a view "unique"
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - viewershipWindowHours);

    // 3. Check if a view for this user and product exists within the window
    const existingView = await this.repository.findFirst({
      where: {
        user_id: userId,
        product_id: productId,
        viewed_at: {
          gte: cutoffTime, // Greater than or equal to the cutoff time
        },
      },
    });

    // 4. If no existing view is found within the window, create a new record
    if (!existingView) {
      await this.repository.create({
        user_id: userId,
        product: {
          connect: {
            id: productId,
          },
        },
        created_by: auditorId,
      });
    }

    return ResponseHelper.CreateResponse<boolean>(
      'Product view recorded successfully',
      true,
      HttpStatus.CREATED,
    );
  }

  /**
   * @param productId Particular product which is being viewed by the user
   * @returns The unique count against this passed product within cut-off time i.e in last 48 hours.
   */
  async getProductUniqueViewershipCount(productId: bigint) {
    const count = await this.repository.getViewershipUniqueCount(productId);
    return ResponseHelper.CreateResponse<number>('', count, HttpStatus.OK);
  }

  async getUserRecommendedWatches(userId: bigint): Promise<ApiResponse<any[]>> {
    const recommended = await this.repository.getUserRecommendations(userId, 5);

    return ResponseHelper.CreateResponse<any[]>(
      'Recommended watches for user',
      recommended,
      HttpStatus.OK,
    );
  }

  /**
   * Gets products whose unique viewership exceeds a given limit.
   *
   * @param limit Minimum number of views required
   * @returns List of products with their view counts that exceed the limit
   */
  async getProductsExceedingViewLimit(sinceDate: Date, limit: number) {
    const products = await this.repository.getProductsExceedingViewLimit(
      sinceDate,
      limit,
    );

    return products;
  }
}
