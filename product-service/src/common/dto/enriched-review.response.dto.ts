class ReviewUser {
  email: string!;
  name: string!;
  fullName: string!;
}

export class EnrichedReviewResponseDto {
  id: number; // Assuming review ID is Int

  product_id: number;

  review: string;

  ratings: number;

  reviewedBy: number; // Original reviewedBy ID

  user: ReviewUser; // Enriched user object

  created_at: Date;
}
