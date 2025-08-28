// src/product-listings/dto/product-full.response.ts
import { Expose } from 'class-transformer';

export class ProductListingResponse {
  @Expose()
  id!: number;

  @Expose()
  brand!: string;

  @Expose()
  category!: string;

  @Expose()
  modelName!: string;

  @Expose()
  referenceNo!: string;

  @Expose()
  priceUsd!: number;

  @Expose()
  currency!: string;

  @Expose()
  releaseDate!: Date;

  @Expose()
  gender!: string;

  @Expose()
  caseMaterial!: string;

  @Expose()
  caseDiameterMm!: number;

  @Expose()
  caseThicknessMm!: number;

  @Expose()
  dialColor!: string;

  @Expose()
  strapMaterial!: string;

  @Expose()
  strapColor!: string;

  @Expose()
  waterResistanceM!: number;

  @Expose()
  crystalType!: string;

  @Expose()
  movementType!: string;

  @Expose()
  powerReserveHours!: number;

  @Expose()
  complications!: string;

  @Expose()
  availability!: string;

  @Expose()
  warrantyYears!: number;

  @Expose()
  countryOfOrigin!: string;
}
