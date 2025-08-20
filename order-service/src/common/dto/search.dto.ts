import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  IsArray,
} from 'class-validator';

export interface SearchResultDTO {
  id: number | string;
  title: string;
  type: 'brand' | 'model' | 'category';
  image_url?: string | null;
  brand_id?: number | string;
  brand_title?: string | null;
  category_id?: number | string;
  category_title?: string | null;
  parent_category_id?: number | string | undefined;
  created_at?: Date | string;
  updated_at?: Date | string | null;
  redirect_url: string;
}

export class GetAllQueryDTO {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize: number = 20;

  @IsOptional()
  @IsObject()
  orderBy?: object;

  @IsOptional()
  @IsObject()
  where?: object;

  @IsOptional()
  select?: object;

  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  @IsIn(['all', 'brand', 'model', 'category'])
  type?: 'all' | 'brand' | 'model' | 'category';

  @IsOptional()
  @IsArray()
  filter?: any[];
}
