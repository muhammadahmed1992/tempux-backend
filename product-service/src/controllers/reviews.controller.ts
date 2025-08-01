import { JwtAuthGuard } from '@Auth/jwt-auth.guard';
import { GetAllQueryDTO } from '@DTO/get-all-query.dto';
import { ProductRatingReviewDTO } from '@DTO/product-rating-reviews';
import { UserId } from '@Auth/decorators/userId.decorator';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ReviewsService } from '@Services/reviews.service';
import { ParseProductReviewRatingtPipe } from '@Common/pipes/parse-product-review-rating-dto';

@Controller('reviews')
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
      select,
    );
  }

  /**
   * @param userId logged-in user id and it is being retrieved from UserId decorator
   * @param productId this is the product id to retrieve the average rating
   * @returns APIResponse<ProductRatingReviewDTO>
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async review(
    @UserId() userId: bigint,
    @Body(ParseProductReviewRatingtPipe) review: ProductRatingReviewDTO,
  ) {
    return this.reviewService.review(userId, review);
  }
}
