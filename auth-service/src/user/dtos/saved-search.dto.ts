import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsDateString,
} from 'class-validator';

export class CreateSavedSearchDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsObject()
  searchQuery!: any; // JSON object containing search filters

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateSavedSearchDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsObject()
  searchQuery?: any;

  @IsOptional()
  @IsString()
  description?: string;
}

export class SavedSearchResponseDto {
  id!: bigint;
  userId!: bigint;
  title!: string;
  searchQuery!: any;
  description?: string;
  createdAt!: Date;
}

export class NewsletterSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsOptional()
  @IsString()
  preferences?: string; // JSON string for subscription preferences
}

export class NewsletterResponseDto {
  isSubscribed!: boolean;
  email!: string;
  subscribedAt?: Date;
  preferences?: any;
}
