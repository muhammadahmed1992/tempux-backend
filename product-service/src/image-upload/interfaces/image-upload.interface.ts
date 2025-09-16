export interface UploadJobResult {
  processedImages: number;
  skippedImages: number;
  errors: string[];
  imageIds: bigint[];
}

export interface ImageUploadMetadata {
  img_url: string;
  alt_text?: string;
  order: number;
  image_type: string;
  file_size: number;
  mime_type: string;
  original_name: string;
  jobId?: string;
}

export interface UploadStatusResponse {
  status: 'completed' | 'failed' | 'processing' | 'waiting';
  progress: number;
  processedImages?: number;
  totalImages?: number;
  errors?: string[];
  imageIds?: bigint[];
}
