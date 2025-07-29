import { HttpStatus, Injectable } from '@nestjs/common';
import ApiResponse from '@Helper/api-response';
import ResponseHelper from '@Helper/response-helper';
import { FavoriteRepository } from '@Repository/favorite.repository';
@Injectable()
export class FavoriteService {
  constructor(private readonly repository: FavoriteRepository) {}

  /**
   *
   * @param userId Id of the user which is marking the product as favorite
   * @param productId Parent Id of the currently selected/marked product variant
   * @param itemId Specific Id of that particular variant
   * @param flag will determine if user wants to mark as favorite or not
   */
  async markProductAsFavorite(
    userId: bigint,
    productId: bigint,
    itemId: bigint,
    flag: boolean,
  ): Promise<ApiResponse<number>> {
    const result = (
      await this.repository.markProductAsFavorite(
        userId,
        productId,
        itemId,
        flag,
      )
    ).id;
    return ResponseHelper.CreateResponse<number>(
      '',
      Number(result),
      HttpStatus.CREATED,
    );
  }
}
