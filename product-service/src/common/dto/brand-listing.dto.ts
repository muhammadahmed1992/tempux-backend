export interface BrandItemDTO {
  id: number;
  title: string;
  image_url?: string | null;
  order?: number | null;
  product_count?: number;
  model_count?: number;
  redirect_url: string;
}

export interface TopBrandDTO {
  id: number;
  title: string;
  image_url?: string | null;
  order: number;
  product_count: number;
  model_count: number;
  redirect_url: string;
  featured: boolean;
}

export interface BrandListingResponseDTO {
  top_brands: TopBrandDTO[];
  alphabetical_brands: {
    [letter: string]: BrandItemDTO[];
  };
  total_brands: number;
  total_top_brands: number;
}

export interface BrandListingRequestDTO {
  include_product_count?: boolean;
  include_model_count?: boolean;
  limit_top_brands?: number;
  featured_only?: boolean;
}
