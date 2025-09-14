import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class AttributeDto {
  @IsNotEmpty()
  @IsNumber()
  attribute_id!: number;

  @IsNotEmpty()
  @IsString()
  dataType!: string;

  @IsNotEmpty()
  value: any;

  @IsBoolean()
  is_mandatory!: boolean;
}

export class ProductDto {
  @IsOptional()
  title?: string;

  @IsOptional()
  description?: string;

  @IsNotEmpty()
  price!: number;

  @IsNotEmpty()
  brand_id!: number;

  @IsNotEmpty()
  model_id!: number;

  @IsNotEmpty()
  gender_id!: number;

  @IsNotEmpty()
  year_of_production!: number;

  @IsNotEmpty()
  category_id!: number;

  @IsNotEmpty()
  sales_price!: number;

  @IsOptional()
  currency_id?: number;

  @IsOptional()
  is_accessory?: boolean;

  @IsArray()
  @IsOptional()
  images?: string[];
}

export class CreateProductDto {
  @IsNotEmpty()
  product!: ProductDto;

  @IsArray()
  attributes: AttributeDto[] = [];
}
