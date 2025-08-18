import { IsDateString } from 'class-validator';

class ReviewUser {
  email = '';
  name = '';
  fullName = '';
}

export class EnrichedReviewResponseDto {
  review?: string | null;
  ratings = -1;
  user: ReviewUser = {} as any; // Enriched user object
  created_at!: string;
}

export class EnrichedReviewResponseHomePageDto {
  review?: string | null;
  ratings = -1;
  user: ReviewUserHome = {} as any; // Enriched user object
}

class ReviewUserHome {
  fullName = '';
}
