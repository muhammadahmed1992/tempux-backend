import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class OrderSummaryRequestDTO {
  @IsNotEmpty()
  @IsNumber()
  productId!: bigint;

  @IsNotEmpty()
  @IsNumber()
  itemId!: bigint;

  @IsNotEmpty()
  @Min(1, {
    message: `Quantity can't be 0.`,
  })
  @IsNumber()
  quantity!: number;
}
