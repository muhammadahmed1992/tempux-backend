class ReviewUser {
  email = "";
  name = "";
  fullName = "";
}

export class EnrichedReviewResponseDto {
  review?: string | null;
  ratings = -1;
  user: ReviewUser = {} as any; // Enriched user object
  created_at: Date = new Date();
}
