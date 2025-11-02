import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ImageUploadService } from './image-upload.service';
import { MIME_TYPES } from './constants/image-configs';
import { ImageUploadController } from './image-upload.controller';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: process.env.UPLOAD_DIR || './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(
            Math.random() * 1e9,
          )}`;
          cb(null, `${uniqueSuffix}-${file.originalname}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 10, // Max 10 files
      },
      fileFilter: (req, file, callback) => {
        const allowedMimes = Object.values(MIME_TYPES);
        if (allowedMimes.includes(file.mimetype as any)) {
          callback(null, true);
        } else {
          callback(new Error(`Invalid file type: ${file.mimetype}`), false);
        }
      },
    }),
  ],
  controllers: [ImageUploadController],
  providers: [
    ImageUploadService,
    {
      provide: 'BullQueue_image-processing',
      useClass: ImageUploadService,
    },
  ],
  exports: [ImageUploadService],
})
export class ImageUploadModule {}
