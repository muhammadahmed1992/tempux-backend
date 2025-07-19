import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export type ProductRatingReviewsDTO = {
  ratings: number;
  review: string | null;
  reviewedBy: bigint;
  created_at: Date;
};

export type ProductRatingReviewsUserDTO = {
  ratings: number;
  review: string;
  reviewedBy: string;
  created_at: Date;
};

export class ProductRatingReviewDTO {
  @IsNotEmpty({ message: "Rating is required." })
  @IsInt({ message: "Rating must be an integer." })
  @Min(0, { message: "Rating cannot be less than 0." })
  @Max(5, { message: "Rating cannot be greater than 5." })
  ratings!: number; // Removed '?' as it's likely required for a review

  @IsOptional() // Make it optional if a review can exist with just a rating
  @IsString({ message: "Review must be a string." })
  @MinLength(5, { message: "Review must be at least 5 characters long." })
  @MaxLength(500, { message: "Review cannot exceed 500 characters." })
  review?: string;

  @IsNotEmpty({ message: "Product ID is required." })
  @IsInt({ message: "Product ID must be a valid number." })
  productId: any;
}
