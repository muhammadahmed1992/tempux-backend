export interface OrderSummaryItemDTO {
  productId: bigint;
  itemId: bigint;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
  taxAmount: number;
  taxName: string;
  total: number;
  symb: string;
}
export interface TaxLineItemDTO {
  taxName: string;
  amount: number;
}
export interface OrderSummaryDTO {
  items: OrderSummaryItemDTO[];
  subtotal: number;
  totalDiscount: number;
  taxSummary: TaxLineItemDTO[];
  grandTotal: number;
}
