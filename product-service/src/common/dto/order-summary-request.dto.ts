import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class OrderSummaryRequestDTO {
  @IsNotEmpty()
  productId!: bigint;

  @IsNotEmpty()
  @IsNumber()
  product_variant_Id!: bigint;

  @IsNotEmpty()
  @Min(1, {
    message: `Quantity can't be 0.`,
  })
  @IsNumber()
  quantity!: number;
}
