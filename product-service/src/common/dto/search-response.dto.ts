export interface SearchResultDTO {
  id: number;
  title: string;
  type: 'brand' | 'collection';
  image_url?: string | null;
  brand_id?: number;
  brand_title?: string;
  redirect_url: string;
}

export interface SearchResponseDTO {
  brands: SearchResultDTO[];
  collections: SearchResultDTO[];
  total_results: number;
}

export class SearchRequestDTO {
  query!: string;
  type?: 'brand' | 'collection' | 'all';
  limit?: number;
  page?: number;
}
