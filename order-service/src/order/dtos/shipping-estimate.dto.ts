import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ShippingEstimateProductDto {
  @IsNumber()
  @IsNotEmpty()
  productId!: number | bigint;

  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class ShippingEstimateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShippingEstimateProductDto)
  products!: ShippingEstimateProductDto[];

  @IsOptional()
  @IsString()
  shipperAddressId?: string;

  @IsOptional()
  @IsString()
  shippingMethod?: string;
}

export class ShippingEstimateProductPricing {
  productId!: number | bigint;
  unitPrice!: number;
  quantity!: number;
  subtotal!: number;
}

export class ShippingEstimateMissingAddress {
  buyer!: boolean;
  sellers!: Array<{
    sellerId: number | bigint;
    missing: boolean;
  }>;
}

export class ShippingEstimateResponse {
  ok!: boolean;
  reason?: string;
  missing?: ShippingEstimateMissingAddress;
  productsPricing?: ShippingEstimateProductPricing[];
  currency?: string;
  lineItems?: ShippingEstimateProductPricing[];
  productsTotal?: number;
  totalShipping?: number;
  grandTotal?: number;
}
