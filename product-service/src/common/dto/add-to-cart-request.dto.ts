import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class AddToCartRequestDTO {
  userId!: bigint;

  @IsNotEmpty()
  productId!: bigint;

  @IsNotEmpty()
  itemId!: bigint;

  @Min(1, {
    message: `Quantity can't be 0.`,
  })
  @IsNumber()
  quantity!: number;
}
