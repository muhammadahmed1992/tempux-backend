import { Expose } from 'class-transformer';

export class ProductMinimalResponseDto {
  @Expose()
  id!: number;

  @Expose()
  brand!: string;

  @Expose()
  modelName!: string;

  @Expose()
  referenceNo!: string;

  @Expose()
  caseMaterial!: string;

  @Expose()
  dialColor!: string;

  @Expose()
  caseDiameterMm!: number;
}
