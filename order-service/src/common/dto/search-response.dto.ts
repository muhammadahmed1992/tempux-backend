import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export interface SearchResultDTO {
  id: number;
  title: string;
  type: 'brand' | 'model';
  image_url?: string | null;
  brand_id?: number;
  brand_title?: string;
  redirect_url: string;
}

export interface SearchResponseDTO {
  brands: SearchResultDTO[];
  models: SearchResultDTO[];
}

export class SearchRequestDTO {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsIn(['brand', 'model', 'all'])
  type?: 'brand' | 'model' | 'all';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}
