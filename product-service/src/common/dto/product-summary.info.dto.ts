import { ProductImageOutput } from '@DTO/product-images-info.dto';
export class ProductSummaryOutputDTO {
  id!: bigint;
  title!: string;
  name!: string;
  description!: string;
  averageRating!: number;
  sales_price!: number;
  symbol!: string;
  currency_id!: number;
  viewerShipCount!: number;
  images!: ProductImageOutput[];
  model?: any;
  productReviews?: any[];
}
