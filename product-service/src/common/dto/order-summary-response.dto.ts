export interface OrderSummaryProductDTO {
  productId: bigint;
  quantity: number;
  sales_price: number;
  discount: number;
  subtotal: number;
  taxAmount: number;
  taxName: string;
  total: number;
  symb: string;
}
export interface TaxLineDTO {
  taxName: string;
  amount: number;
}
export interface OrderSummaryDTO {
  products: OrderSummaryProductDTO[];
  subtotal: number;
  totalDiscount: number;
  taxSummary: TaxLineDTO[];
  grandTotal: number;
}
