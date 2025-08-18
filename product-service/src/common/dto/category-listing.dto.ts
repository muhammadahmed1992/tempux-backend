export interface CategoryItemDTO {
  id: number;
  title: string;
  image_url?: string | null;
  order?: number | null;
  product_count?: number;
  redirect_url: string;
}

export interface TopCategoryDTO {
  id: number;
  title: string;
  image_url?: string | null;
  order: number;
  product_count: number;
  redirect_url: string;
  featured: boolean;
}

export interface CategoryListingResponseDTO {
  top_categories: TopCategoryDTO[];
  alphabetical_categories: {
    [letter: string]: CategoryItemDTO[];
  };
  total_categories: number;
  total_top_categories: number;
}

export interface CategoryListingRequestDTO {
  include_product_count?: boolean;
  limit_top_categories?: number;
  featured_only?: boolean;
}
