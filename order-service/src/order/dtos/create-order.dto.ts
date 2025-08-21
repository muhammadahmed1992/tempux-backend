import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  Min,
  IsBigInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsBigInt()
  @IsNotEmpty()
  productId!: bigint;

  @IsBigInt()
  @IsNotEmpty()
  productVariantId!: bigint;

  @IsBigInt()
  @IsNotEmpty()
  sellerId!: bigint;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsNumber()
  @Min(0)
  discount!: number;

  @IsNumber()
  @Min(0)
  taxAmount!: number;
}

export class ShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  addressLine1!: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;

  @IsString()
  @IsNotEmpty()
  postalCode!: string;

  @IsString()
  @IsNotEmpty()
  country!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;
}

export class CreateOrderDto {
  @IsBigInt()
  @IsNotEmpty()
  buyerId!: bigint;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  orderItems!: CreateOrderItemDto[];

  @IsOptional()
  @IsBoolean()
  useSavedShippingAddress?: boolean;

  @IsOptional()
  @IsBigInt()
  savedShippingAddressId?: bigint;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto;

  @IsNumber()
  @Min(0)
  totalDiscount!: number;

  @IsNumber()
  @Min(0)
  totalTax!: number;

  @IsNumber()
  @Min(0)
  totalShippingCost!: number;

  @IsNumber()
  @Min(0)
  totalAmount!: number;
}
