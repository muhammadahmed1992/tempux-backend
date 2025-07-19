import { GetAllQueryDTO } from "@DTO/get-all-query.dto";
import { ProductRatingReviewDTO } from "@DTO/product.rating.reviews";
import { UserId } from "@Helper/decorators/userId.decorator";
import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ReviewsService } from "@Services/reviews.service";

@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewService: ReviewsService) {}

  @Get()
  async getAll(@Query() query: GetAllQueryDTO) {
    const { page, pageSize, orderBy, where, select } = query;
    return this.reviewService.getAllPagedProductReviewsDataByUser(
      page,
      pageSize,
      orderBy,
      where,
      select
    );
  }

  /**
   * @param productId this is the product id to retrieve the average rating
   * @returns <APIResponse<AverageProductRating>>
   */
  @Get("/product/:productId")
  async productAverageRatings(@Param("productId") productId: bigint) {
    return this.reviewService.fetchAverageRatingByProduct(productId);
  }

  /**
   * @param productId this is the product id to retrieve the average rating
   * @returns APIResponse<ProductRatingReviewsUserDTO>
   */
  @Get("/product/rating/:productId")
  async productReviewRatings(
    @Param("productId") productId: bigint,
    @Query() query: GetAllQueryDTO
  ) {
    const { page, pageSize, orderBy } = query;
    return this.reviewService.getProductReviewsAndAverageRating(
      productId,
      page,
      pageSize,
      orderBy
    );
  }

  /**
   * @param userId logged-in user id and it is being retrieved from UserId decorator
   * @param productId this is the product id to retrieve the average rating
   * @returns APIResponse<ProductRatingReviewDTO>
   */
  @Post()
  async review(
    @UserId() userId: bigint,
    @Body() review: ProductRatingReviewDTO
  ) {
    return this.reviewService.review(userId, review);
  }
}
