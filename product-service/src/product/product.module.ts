import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from './product.repository';
import { ProductAnalyticsModule } from '@ProductAnalytics/product-analytics.module';
import { ProductIdResolver } from '@Common/resolver/product-id.resolver';
import { HashidsModule } from '../hash-ids/hash-ids.module';
import { FavoriteModule } from '@Favorite/favorite.module';
import { ProductCreatedListener } from './listener/product-created.listener';
import { LoggingModule } from '@Common/logging';
import { SlugModule } from 'src/slug/slug.module';
import { ProductValidationService } from './product-validation.service';
import { ProductAttributesService } from 'src/product-attributes/product-attributes.service';
import { ImageUploadModule } from 'src/image-upload/image-upload.module';
import { ImageUploadService } from 'src/image-upload/image-upload.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { MIME_TYPES } from 'src/image-upload/constants/image-configs';

@Module({
  imports: [
    HashidsModule,
    FavoriteModule,
    ProductAnalyticsModule,
    LoggingModule,
    ImageUploadModule,
    SlugModule,
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
  controllers: [ProductController],
  providers: [
    ProductService,
    ProductValidationService,
    ProductRepository,
    ProductIdResolver,
    ProductCreatedListener,
    ProductAttributesService,
    ImageUploadService,
  ],
})
export class ProductModule {}
