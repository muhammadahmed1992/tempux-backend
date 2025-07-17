import { GetAllQueryDTO } from "@DTO/get-all-query.dto";
import { Controller, Get, Query } from "@nestjs/common";
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
}
