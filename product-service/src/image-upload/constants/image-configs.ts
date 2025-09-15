export const MIME_TYPES = {
  JPEG: 'image/jpeg',
  JPG: 'image/jpg',
  PNG: 'image/png',
  WEBP: 'image/webp',
} as const;

export const ALLOWED_IMAGE_TYPES = {
  SIGN_OF_WEAR: 'sign_of_wear',
  PROOF_OF_OWNERSHIP: 'ownership',
  PRODUCT_IMAGE: 'gallery',
} as const;

export type ImageType =
  (typeof ALLOWED_IMAGE_TYPES)[keyof typeof ALLOWED_IMAGE_TYPES];

export const IMAGE_CONFIGS = {
  [ALLOWED_IMAGE_TYPES.SIGN_OF_WEAR]: {
    maxFiles: 10,
    allowedMimeTypes: [
      MIME_TYPES.JPEG,
      MIME_TYPES.JPG,
      MIME_TYPES.PNG,
      MIME_TYPES.WEBP,
    ],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    path: 'wear-signs',
  },
  [ALLOWED_IMAGE_TYPES.PROOF_OF_OWNERSHIP]: {
    maxFiles: 5,
    allowedMimeTypes: [
      MIME_TYPES.JPEG,
      MIME_TYPES.JPG,
      MIME_TYPES.PNG,
      MIME_TYPES.WEBP,
    ],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    path: 'ownership',
  },
  [ALLOWED_IMAGE_TYPES.PRODUCT_IMAGE]: {
    maxFiles: 20,
    allowedMimeTypes: [
      MIME_TYPES.JPEG,
      MIME_TYPES.JPG,
      MIME_TYPES.PNG,
      MIME_TYPES.WEBP,
    ],
    maxFileSize: 8 * 1024 * 1024, // 8MB
    path: 'gallery',
  },
} as const;
