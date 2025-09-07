import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductAttributeCategoryMappingDto {
  @IsNumber()
  @IsNotEmpty()
  attribute_category_id!: number;

  @IsNumber()
  @IsNotEmpty()
  attribute_id!: number;

  @IsString()
  @IsNotEmpty()
  data_type!: string;

  @IsBoolean()
  @IsOptional()
  is_mandatory?: boolean;
}
