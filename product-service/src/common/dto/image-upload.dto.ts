import {
  IsEnum,
  IsArray,
  IsOptional,
  IsString,
  IsNotEmpty,
  ArrayMaxSize,
  IsNumber,
} from 'class-validator';
import {
  ALLOWED_IMAGE_TYPES,
  ImageType,
} from '../../image-upload/constants/image-types';

export class ImageUploadDto {
  @IsNotEmpty()
  @IsNumber()
  product_id!: number;

  @IsEnum(ALLOWED_IMAGE_TYPES)
  @IsNotEmpty()
  imageType: ImageType = ALLOWED_IMAGE_TYPES.PRODUCT_IMAGE;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10) // Match the max files limit
  altTexts?: string[];
}

export class GetImagesQueryDto {
  @IsOptional()
  @IsEnum(ALLOWED_IMAGE_TYPES)
  type?: ImageType;

  @IsOptional()
  @IsString()
  imageType?: string;
}
