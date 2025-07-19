export interface AddToCartRequestDTO {
  userId: bigint;
  productId: bigint;
  product_variant_id: bigint;
  quantity: number;
}
