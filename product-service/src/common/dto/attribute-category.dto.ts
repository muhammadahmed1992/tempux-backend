import { IsNotEmpty, IsNumber, IsString } from "class-validator";

// Response DTO for attribute categories
export class AttributeCategoryDto {
  @IsNumber()
  @IsNotEmpty()
  id!: number;
  @IsNotEmpty()
  @IsString()
  name!: string;
  @IsNotEmpty()
  is_active!: boolean;;
}

// Response DTO for attribute category mappings
export class AttributeCategoryMappingDto {
  @IsNumber()
  @IsNotEmpty()
  id!: number;
  @IsNumber()
  @IsNotEmpty()
  attribute_id!: number;
  @IsNotEmpty()
  @IsString()
  attribute_name!: string;
  @IsNotEmpty()
  @IsString()
  attribute_display_name!: string;
  @IsString()
  attribute_unit?: string | null;
  @IsNotEmpty()
  @IsString()
  data_type!: string;
  @IsNotEmpty()
  is_mandatory!: boolean;
  @IsString()
  control_type?: string | null;
}

// Response DTO for attribute category mappings with category info
export class AttributeCategoryMappingsResponseDto {
  @IsNumber()
  @IsNotEmpty()
  categoryId!: number;
  @IsNotEmpty()
  @IsString()
  categoryName!: string;
  @IsNotEmpty()
  attributes!: AttributeCategoryMappingDto[];
}