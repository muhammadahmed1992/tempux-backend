export const ALLOWED_IMAGE_TYPES = {
  SIGN_OF_WEAR: 'sign_of_wear',
  PROOF_OF_OWNERSHIP: 'ownership',
  PRODUCT_IMAGE: 'gallery',
} as const;

export type ImageType =
  (typeof ALLOWED_IMAGE_TYPES)[keyof typeof ALLOWED_IMAGE_TYPES];

export interface ImageConfig {
  maxFiles: number;
  allowedMimeTypes: string[];
  maxFileSize: number; // in bytes
  path: string;
}

export const IMAGE_TYPE_CONFIG: Record<ImageType, ImageConfig> = {
  [ALLOWED_IMAGE_TYPES.SIGN_OF_WEAR]: {
    maxFiles: 10,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    path: 'wear-signs',
  },
  [ALLOWED_IMAGE_TYPES.PROOF_OF_OWNERSHIP]: {
    maxFiles: 5,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    path: 'ownership',
  },
  [ALLOWED_IMAGE_TYPES.PRODUCT_IMAGE]: {
    maxFiles: 20,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxFileSize: 8 * 1024 * 1024, // 8MB
    path: 'gallery',
  },
};
