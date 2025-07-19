import { HttpStatus, Injectable } from "@nestjs/common";
import ApiResponse from "@Helper/api-response";
import ResponseHelper from "@Helper/response-helper";
import { FavoriteRepository } from "@Repository/favorite.repository";
@Injectable()
export class FavoriteService {
  constructor(private readonly repository: FavoriteRepository) {}

  /**
   *
   * @param userId Id of the user which is marking the product as favorite
   * @param productId Parent Id of the currently selected/marked product variant
   * @param itemId Specific Id of that particular variant
   */
  async markProductAsFavorite(
    userId: bigint,
    productId: bigint,
    itemId: bigint
  ): Promise<ApiResponse<number>> {
    const result = (
      await this.repository.markProductAsFavorite(userId, productId, itemId)
    ).id;
    return ResponseHelper.CreateResponse<number>(
      "",
      Number(result),
      HttpStatus.CREATED
    );
  }

  /**
   * This method will be un marking or removing the product from Favorite. But it will only updated the isDelete flag won't remove permanently.
   * @param userId Id of the user which is marking the product as favorite
   * @param productId Parent Id of the currently selected/marked product variant
   * @param itemId Specific Id of that particular variant
   */
  async markProductAsUnFavorite(
    userId: bigint,
    productId: bigint,
    itemId: bigint
  ): Promise<ApiResponse<number>> {
    const result = (
      await this.repository.markProductAsUnFavorite(userId, productId, itemId)
    ).id;
    return ResponseHelper.CreateResponse<number>(
      "",
      Number(result),
      HttpStatus.NO_CONTENT
    );
  }
}
