export interface AddToCartRequestDTO {
  userId: bigint;
  productId: bigint;
  product_variant_Id: bigint;
  quantity: number;
}
