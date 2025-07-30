import ApiResponse from '@Helper/api-response';
import ResponseHelper from '@Helper/response-helper';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ProductAnalyticsRepository } from '@Repository/product.analytics.repository';
import { GlobalConfigurationService } from '@Services/global.configuration.service';

@Injectable()
export class ProductAnalyticsService {
  constructor(
    private readonly globalConfigService: GlobalConfigurationService,
    private readonly repository: ProductAnalyticsRepository,
  ) {}

  /**
   * Records a unique product variant view for a logged-in user within a configured time window.
   * If the user has already viewed this variant within the window, no new record is created.
   *
   * @param userId The ID of the logged-in user.
   * @param productId The ID of the main product.
   * @param variantId The ID of the specific product variant being viewed.
   * @param auditorId The ID of the user performing the action (usually same as userId).
   */
  async recordProductView(
    userId: bigint,
    productId: bigint,
    variantId: bigint,
    auditorId: bigint,
  ): Promise<ApiResponse<boolean>> {
    // 1. Get the configured time window for unique viewership
    const viewershipWindowHours =
      await this.globalConfigService.getProductViewershipWindowHours();

    // 2. Calculate the cutoff time for considering a view "unique"
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - viewershipWindowHours);

    // 3. Check if a view for this user, product, and variant exists within the window
    const existingView = await this.repository.findFirst({
      where: {
        user_id: userId,
        product_id: productId,
        product_variant_id: variantId,
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
        productVariant: {
          connect: {
            id: variantId,
          },
        },
        created_by: auditorId,
      });
      console.log(
        `[ProductAnalytics] Recorded new unique view for User:${userId}, Product:${productId}, Variant:${variantId}`,
      );
    }

    return ResponseHelper.CreateResponse<boolean>('', true, HttpStatus.OK);
  }
}
