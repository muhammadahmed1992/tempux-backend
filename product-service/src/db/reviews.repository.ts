import { Injectable } from "@nestjs/common";
import { Prisma, PrismaClient, reviews_ratings } from "@prisma/client";
import { BaseRepository } from "./base.repository";
import {
  ProductRatingReviewDTO,
  ProductRatingReviewsDTO,
} from "@DTO/product.rating.reviews";

@Injectable()
export class ReviewsRepository extends BaseRepository<
  reviews_ratings,
  Prisma.reviews_ratingsCreateInput,
  Prisma.reviews_ratingsUpdateInput,
  Prisma.reviews_ratingsWhereUniqueInput,
  Prisma.reviews_ratingsWhereInput,
  Prisma.reviews_ratingsFindUniqueArgs,
  Prisma.reviews_ratingsFindManyArgs,
  Prisma.reviews_ratingsFindFirstArgs,
  { data: reviews_ratings[]; totalCount: number } // For paginated records.
> {
  // TODO: Will appropriate solution late regarding as any
  constructor(private readonly prisma: PrismaClient) {
    super(prisma, prisma.reviews_ratings as any);
  }

  /**
   * Calculates the average rating for a given product ID.
   * The ratings are assumed to be on a scale of 1 to 5.
   *
   * @param productId The ID of the product (BigInt).
   * @returns The average rating for the product, or null if no ratings exist.
   */
  async getAverageRatingByProductId(productId: bigint): Promise<number> {
    // Use Prisma's aggregate function to calculate the average of the 'ratings' field
    const result = await this.prisma.reviews_ratings.aggregate({
      _avg: {
        ratings: true,
      },
      where: {
        product_id: productId,
        is_deleted: false,
      },
    });
    return result._avg.ratings ?? 0;
  }

  /**
   * Fetches individual rating,reviews, their details for a given product ID..
   *
   * @param productId The ID of the product (BigInt).
   * @returns The review,rating, when review were made and user id for the current review, or null if no ratings exist.
   */
  async getDetailRatingAndReviewByProductId(
    productId: bigint,
    page: number,
    pageSize: number,
    order?: object
  ): Promise<{ data: ProductRatingReviewsDTO[]; totalCount: number }> {
    // Fetch all relevant reviews for the product
    const { data, totalCount } = await this.model.findManyPaginated(
      page,
      pageSize,
      {
        product_id: productId,
        is_deleted: false,
      },
      {
        review: true,
        ratings: true,
        reviewedBy: true,
        created_at: true,
      },
      order
    );
    return { data, totalCount };
  }

  /**
   * Writes a single review and rating against a particular product
   * @param userId currently logged-in user who is reviewing it.
   * @param review this is an object of type ProductRatingReviewDTO which creates a review with rating for a product.
   *
   * @returns id of the newly created record.
   */
  async review(userId: bigint, review: ProductRatingReviewDTO) {
    return this.prisma.reviews_ratings.upsert({
      where: {
        product_id_reviewedBy: {
          product_id: review.productId,
          reviewedBy: userId,
        },
      },
      update: {
        review: review.review,
        ratings: review.ratings,
        updated_at: new Date(),
        updated_by: userId,
        is_deleted: false,
      },
      create: {
        product: {
          connect: {
            id: review.productId,
          },
        },
        reviewedBy: userId,
        created_by: userId,
        review: review.review,
        ratings: review.ratings,
        // created_at, updated_at, deleted_at, is_deleted will be handled by @default and @updatedAt
      },
      // 4. 'select' clause: What to return from the operation.
      select: {
        id: true,
        created_at: true,
        updated_at: true,
      },
    });
  }
}
