// product-service/src/reviews/reviews.service.ts
import { BadRequestException, HttpStatus, Injectable } from "@nestjs/common";
import {
  UserDetails,
  UserProxyService,
} from "@Proxy/user-proxy/user-proxy.service"; // Import the proxy service
import { EnrichedReviewResponseDto } from "@DTO/enriched-review.response.dto";
import { ReviewsRepository } from "@Repository/reviews.repository";
import ApiResponse from "@Helper/api-response";
import ResponseHelper from "@Helper/response-helper";
import Constants from "@Helper/constants";

@Injectable()
export class ReviewsService {
  constructor(
    private readonly repository: ReviewsRepository,
    private readonly userProxyService: UserProxyService
  ) {}

  /**
   * Finds all reviews for a product and enriches them with user details.
   * @param where this will contains generic filter as it might contains the review for particular product or for all.
   * @returns A promise that resolves to an array of EnrichedReviewResponseDto.
   */
  async getAllPagedProductReviewsDataByUser(
    pageNumber: number,
    pageSize: number,
    order?: object,
    where?: object,
    select?: object
  ): Promise<ApiResponse<EnrichedReviewResponseDto[]>> {
    const { data, totalCount } = await this.repository.findManyPaginated(
      pageNumber,
      pageSize,
      where,
      select,
      order
    );

    // Extract unique user IDs from the reviews
    const uniqueUserIds = [...new Set(data.map((review) => review.reviewedBy))];

    // Fetch user details in a single batch call to the User Service
    const userDetailsMap = new Map<number, UserDetails>();
    try {
      const users = await this.userProxyService.getUsersDetailsByIds(
        uniqueUserIds
      );
      // TODO: will fix later
      (users as any).data.forEach((user: any) =>
        userDetailsMap.set(user.id, user)
      );
    } catch (error) {
      console.error("Failed to fetch user details for reviews:", error);
      // Decide how to handle this: return reviews without user data, throw error, etc.
      // For now, we'll proceed, and 'user' will be undefined for reviews where user data couldn't be fetched.
      throw new BadRequestException(
        "Failed to fetch user details for reviews:"
      );
    }

    // Enrich reviews with user details
    const enrichedReviews: EnrichedReviewResponseDto[] = data.map((review) => ({
      review: review.review,
      ratings: review.ratings,
      user: userDetailsMap.get(Number(review.reviewedBy)) || {
        email: "unknown@example.com",
        name: "Unknown User",
        fullName: "Unknow User - Full Name",
      },
      created_at: review.created_at,
    }));

    return ResponseHelper.CreateResponse<EnrichedReviewResponseDto[]>(
      Constants.DATA_SUCCESS,
      enrichedReviews,
      HttpStatus.OK,
      {
        pageNumber,
        pageSize,
        totalCount,
        numberOfTotalPages: Math.ceil(totalCount / pageSize),
      }
    );
  }
}
