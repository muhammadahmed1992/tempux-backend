export class OrderItemResponseDto {
  id!: bigint;
  orderId!: bigint;
  sellerId!: bigint;
  productId!: bigint;
  productVariantId!: bigint;
  quantity!: number;
  price!: number;
  discount!: number;
  taxAmount!: number;
  totalPrice!: number;
  orderStatus!: string;
  payoutStatus!: string;
  escrowStatus!: string;
  orderItemDate!: Date;
  createdAt!: Date;
  updatedAt?: Date;
}

export class OrderResponseDto {
  id!: bigint;
  buyerId!: bigint;
  totalDiscount!: number;
  totalTax!: number;
  totalShippingCost!: number;
  totalAmount!: number;
  orderDate!: Date;
  orderStatus!: string;
  paymentStatus!: string;
  fulfillmentStatus!: string;
  shippingAddressId?: bigint;
  billingAddressId?: bigint;
  createdAt!: Date;
  updatedAt?: Date;
  orderItems!: OrderItemResponseDto[];
}

export class OrderListingDto {
  id!: bigint;
  buyerId!: bigint;
  totalAmount!: number;
  orderDate!: Date;
  orderStatus!: string;
  paymentStatus!: string;
  fulfillmentStatus!: string;
  itemCount!: number;
}
