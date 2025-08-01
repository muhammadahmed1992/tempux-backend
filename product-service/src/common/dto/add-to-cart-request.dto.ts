import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class AddToCartRequestDTO {
  userId!: bigint;
  @IsNotEmpty()
  productId!: bigint;
  @IsNotEmpty()
  @IsNumber()
  product_variant_Id!: bigint;
  @Min(1, {
    message: `Quantity can't be 0. Enter atleast 1.`,
  })
  @IsNumber()
  quantity!: number;
}
