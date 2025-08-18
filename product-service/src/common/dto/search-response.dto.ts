export interface SearchResultDTO {
  id: number;
  title: string;
  type: 'brand' | 'model';
  image_url?: string | null;
  brand_id?: number;
  brand_title?: string;
  redirect_url: string;
}

export interface SearchResponseDTO {
  brands: SearchResultDTO[];
  models: SearchResultDTO[];
  total_results: number;
}

export class SearchRequestDTO {
  query!: string;
  type?: 'brand' | 'model' | 'all';
  limit?: number;
  page?: number;
}
