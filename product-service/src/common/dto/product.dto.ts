import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ImageUploadDto } from './image-upload.dto';

export class AttributeDto {
  @IsNotEmpty()
  @Type(() => Number) // Add this
  @IsNumber()
  attribute_id!: number;

  @IsNotEmpty()
  @IsString()
  dataType!: string;

  @IsNotEmpty()
  value: any;

  @Transform(({ value }) => value === 'true' || value === true) // Add this
  @IsBoolean()
  is_mandatory!: boolean;
}

export class ProductDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @Type(() => Number) // Add this
  @IsNumber()
  price!: number;

  @IsNotEmpty()
  @Type(() => Number) // Add this
  @IsNumber()
  brand_id!: number;

  @IsNotEmpty()
  @Type(() => Number) // Add this
  @IsNumber()
  model_id!: number;

  @IsNotEmpty()
  @Type(() => Number) // Add this
  @IsNumber()
  gender_id!: number;

  @IsNotEmpty()
  @Type(() => Number) // Add this
  @IsNumber()
  year_of_production!: number;

  @IsNotEmpty()
  @Type(() => Number) // Add this - THIS IS THE KEY ONE FOR YOUR ISSUE
  @IsNumber()
  category_id!: number;

  @IsNotEmpty()
  @Type(() => Number) // Add this
  @IsNumber()
  sales_price!: number;

  @IsOptional()
  @Type(() => Number) // Add this
  @IsNumber()
  currency_id?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true) // Add this
  @IsBoolean()
  is_accessory?: boolean;

  @IsArray()
  @IsOptional()
  images?: string[];
}

export class CreateProductDto {
  @IsNotEmpty()
  @Type(() => ProductDto) // Add this
  product!: ProductDto;

  @IsArray()
  @Type(() => AttributeDto) // Add this
  attributes: AttributeDto[] = [];
  
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  
  @IsOptional()
  imageFiles?: {
    files: Express.Multer.File[];
    imageType: string;
    altTexts?: string[];
  };
  
  @IsOptional()
  @IsString()
  imageType?: string;
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  altTexts?: string[];
  @Type(() => ImageUploadDto)
  images?: ImageUploadDto[];

}
