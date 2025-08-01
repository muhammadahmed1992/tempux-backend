import { ProductImageOutput } from './product-images-info.dto';

export interface ProductSummaryOutputDTO {
  id: BigInt;
  name: string;
  title: string | null;
  averageRating: number;
  price: number;
  symbol: string;
  colors: {
    id: number;
    name: string;
    hexCode?: string;
  }[];
  images: ProductImageOutput[];
  viewerShipCount: number;
}
