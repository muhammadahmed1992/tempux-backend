import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsIn,
} from 'class-validator';

export class CreateAddressDto {
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
  countryCode!: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsString()
  @IsIn(['SHIPPING', 'BILLING', 'WAREHOUSE', 'PRIMARY'])
  addressType!: string;
}

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class AddressResponseDto {
  id!: bigint;
  userId!: bigint;
  addressType!: string;
  label?: string | null;
  addressLine1!: string;
  addressLine2?: string | null;
  city!: string;
  state!: string;
  postalCode!: string;
  countryCode!: string;
  isDefault!: boolean;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export class AddressesByContextResponseDto {
  shippingAddresses?: AddressResponseDto[];
  billingAddresses?: AddressResponseDto[];
  warehouseAddresses?: AddressResponseDto[];
  defaultShippingAddress?: AddressResponseDto;
  defaultBillingAddress?: AddressResponseDto;
  defaultWarehouseAddress?: AddressResponseDto;
}

export class ValidateAddressOwnershipDto {
  @IsNumber()
  addressId!: number | bigint;

  @IsNumber()
  userId!: number | bigint;

  @IsOptional()
  @IsString()
  @IsIn(['SHIPPING', 'BILLING', 'PRIMARY', 'WAREHOUSE'])
  expectedType?: string;
}
