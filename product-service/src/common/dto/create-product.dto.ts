import { IsNotEmpty, IsString, IsNumber, IsArray, IsBoolean, IsOptional } from "class-validator";

export class AttributeValueDto {
  @IsNumber()
  attributeId!: number;

  @IsString()
  dataType!: string;

  @IsNotEmpty()
  value: any;

  @IsBoolean()
  is_mandatory!: boolean;
}

export class CreateProductDto {
  @IsNumber()
  categoryId!: number;

  @IsNotEmpty()
  product: any;

  @IsArray()
  attributeValues: AttributeValueDto[] = [];
}
