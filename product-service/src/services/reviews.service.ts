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
import { AverageProductRatingDTO } from "@DTO/average.product.rating";
import {
  ProductRatingReviewDTO,
  ProductRatingReviewsDTO,
  ProductRatingReviewsUserDTO,
} from "@DTO/product.rating.reviews";

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
    const userDetailsMap = await this.fetchUserDetailsInBatch(uniqueUserIds);
    // Enrich reviews with user details
    const enrichedReviews: EnrichedReviewResponseDto[] = data.map((review) => ({
      review: review.review,
      ratings: review.ratings,
      user: userDetailsMap.get(review.reviewedBy) || {
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

  /**
   * This method will return the average rating per product
   * @param productId this is the productId of a product which we need to extract the average rating.
   */
  async fetchAverageRatingByProduct(
    productId: bigint
  ): Promise<ApiResponse<AverageProductRatingDTO>> {
    const result = await this.repository.getAverageRatingByProductId(productId);
    return ResponseHelper.CreateResponse<AverageProductRatingDTO>(
      "",
      {
        averageRating: result,
      },
      HttpStatus.OK
    );
  }

  /**
   * Fetches individual rating,reviews, their details for a given product ID.
   * It makes an HTTP call to the user service to get the names of the reviewers.
   * @param productId The ID of the product (BigInt).
   * @returns An object containing the product ID and a list of detailed reviews including their rating.
   */
  async getProductReviewsAndAverageRating(
    productId: bigint,
    page: number,
    pageSize: number,
    orderBy?: object
  ): Promise<ApiResponse<ProductRatingReviewsUserDTO[]>> {
    // 1. Fetch all relevant reviews for the product
    const { data: reviews, totalCount } =
      await this.repository.getDetailRatingAndReviewByProductId(
        productId,
        page,
        pageSize,
        orderBy
      );

    // 3. Extract unique reviewer IDs to fetch their names from the user service
    const reviewerIds = [...new Set(reviews.map((r) => r.reviewedBy))];

    let userDetailsMap = new Map<bigint, UserDetails>();
    if (reviewerIds.length > 0) {
      userDetailsMap = await this.fetchUserDetailsInBatch(reviewerIds);
    }

    let user: UserDetails | null;
    // 4. Map the reviews to include the reviewer's name
    const detailedReviews: ProductRatingReviewsUserDTO[] = reviews.map(
      (review) => {
        user = userDetailsMap.get(review.reviewedBy) ?? null;
        return {
          review: review.review,
          ratings: review.ratings,
          reviewedBy: user?.fullName || user?.name || "Unknown User",
          created_at: review.created_at,
        };
      }
    );
    return ResponseHelper.CreateResponse<ProductRatingReviewsUserDTO[]>(
      "",
      detailedReviews,
      HttpStatus.OK,
      {
        pageNumber: page,
        pageSize,
        totalCount,
        numberOfTotalPages: Math.ceil(totalCount / pageSize),
      }
    );
  }

  /**
   *
   * @param userId logged-in userId which is going to mark review
   * @param review actual object which contains review, rating and the productId
   * @returns id of the newly created review in the system
   */
  async review(
    userId: bigint,
    review: ProductRatingReviewDTO
  ): Promise<ApiResponse<number>> {
    const id = (await this.repository.review(userId, review)).id;
    return ResponseHelper.CreateResponse<number>(
      Constants.REVIEW_MARKED_SUCCESSFULLy,
      id,
      HttpStatus.CREATED
    );
  }

  private async fetchUserDetailsInBatch(uniqueUserIds: bigint[]) {
    // Fetch user details in a single batch call to the User Service
    const userDetailsMap = new Map<bigint, UserDetails>();
    try {
      const users = await this.userProxyService.getUsersDetailsByIds(
        uniqueUserIds
      );
      // TODO: will fix later
      (users as any).data.forEach((user: any) =>
        userDetailsMap.set(user.id, user)
      );
      return userDetailsMap;
    } catch (error) {
      console.error("Failed to fetch user details for reviews:", error);
      // Decide how to handle this: return reviews without user data, throw error, etc.
      // For now, we'll proceed, and 'user' will be undefined for reviews where user data couldn't be fetched.
      throw new BadRequestException(
        "Failed to fetch user details for reviews:"
      );
    }
  }
}
