import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ImageType } from './constants/image-types';
import {
  UploadJobResult,
  ImageUploadMetadata,
} from './interfaces/image-upload.interface';
import { AppLoggerService } from '@Common/logging';

@Injectable()
export class ImageUploadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) { }

  async uploadProductImages(
    productId: bigint,
    imageType: ImageType,
    files: Express.Multer.File[],
    altTexts?: string[],
    userId?: bigint,
    transaction?: any,
  ): Promise<UploadJobResult> {
    const result: UploadJobResult = {
      processedImages: 0,
      skippedImages: 0,
      errors: [],
      imageIds: [],
    };

    const finalUploadPath = path.join(
      process.env.UPLOAD_DIR || './uploads',
      productId.toString(),
      imageType,
    );

    try {
      // Use provided transaction or create new one
      const prisma = transaction || this.prisma;

      // Verify product exists before proceeding
      const productExists = await prisma.product.findUnique({
        where: {
          id: productId,
          is_deleted: false,
        },
        select: { id: true },
      });

      if (!productExists) {
        throw new Error(`Product with ID ${productId} not found or is deleted`);
      }

      // Ensure final upload directory exists
      await fs.mkdir(finalUploadPath, { recursive: true });

      // Get max order for proper sequencing
      const maxOrder = await this.getMaxImageOrder(
        productId,
        imageType,
        transaction,
      );

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let tempFilePath: string | null = file.path; // Storing original temp path for cleanup

        try {
          // With diskStorage, file.path contains the temporary file location
          if (!file.path) {
            throw new Error(
              'File path is missing - diskStorage configuration issue',
            );
          }

          // Verify the temporary file exists
          try {
            await fs.access(file.path);
          } catch (accessError) {
            throw new Error(`Temporary file not accessible: ${file.path}`);
          }

          // Generate organized filename
          const fileExt = path.extname(file.originalname) || '.jpg';
          const baseName = path.basename(file.originalname, fileExt);
          const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substring(7);
          const fileName = `${timestamp}-${randomSuffix}-${sanitizedBaseName}${fileExt}`;
          const finalFilePath = path.join(finalUploadPath, fileName);

          // Move file from temp location to organized directory
          await fs.rename(file.path, finalFilePath);

          // Update temp file path to null since it's been moved
          tempFilePath = null;

          // Verify file was moved successfully
          try {
            const stats = await fs.stat(finalFilePath);
            if (stats.size !== file.size) {
              throw new Error(
                `File size mismatch. Expected: ${file.size}, Actual: ${stats.size}`,
              );
            }
          } catch (error: any) {
            throw new Error(`Failed to verify moved file: ${error.message}`);
          }

          // Create database record with relative path for portability
          const relativePath = path.relative(process.cwd(), finalFilePath);
          const image = await prisma.product_images.create({
            data: {
              product_id: productId,
              created_by: userId || BigInt(1), // Default if no userId
              img_url: relativePath, // Store relative path
              alt_text: altTexts?.[i] || `${sanitizedBaseName} image`,
              order: maxOrder + i + 1,
              image_type: imageType,
              type: imageType, // Required by schema
              file_size: file.size,
              mime_type: file.mimetype,
              original_name: file.originalname,
            },
          });

          result.processedImages++;
          result.imageIds.push(BigInt(image.id));

          this.logger.info({
            message: `Successfully processed: ${file.originalname} -> ${fileName}`,
            context: {
              productId,
              imageType,
              fileName,
            },
          });
        } catch (error: any) {
          const errorMessage = `Failed to process ${file.originalname}: ${error.message}`;
          result.errors.push(errorMessage);
          result.skippedImages++;
          this.logger.error({
            message: errorMessage,
            context: {
              productId,
              imageType,
              fileName: file.originalname,
            },
            error,
          });

          // Cleanup temporary file if it still exists at original location
          if (tempFilePath) {
            try {
              await fs.access(tempFilePath); // Check if file exists first
              await fs.unlink(tempFilePath);
              this.logger.info({
                message: `Cleaned up temp file: ${tempFilePath}`,
                context: {
                  productId,
                  imageType,
                  fileName: file.originalname,
                },
              });
            } catch (cleanupError) {
              // File might have already been moved or doesn't exist, ignore error
              this.logger.info({
                message: `Temp file cleanup not needed: ${tempFilePath}`,
                context: {
                  productId,
                  imageType,
                  fileName: file.originalname,
                },
              });
            }
          }
        }
      }

      return result;
    } catch (error: any) {
      console.error(`Critical error in image processing: ${error.message}`);

      // Cleanup any remaining temporary files
      for (const file of files) {
        if (file.path) {
          try {
            await fs.access(file.path); // Check if file exists first
            await fs.unlink(file.path);
            this.logger.info({
              message: `Cleaned up remaining temp file: ${file.path}`,
              context: {
                productId,
                imageType,
                fileName: file.originalname,
              },
            });
          } catch (cleanupError) {
            // File might not exist, ignore cleanup errors for temp files
            this.logger.info({
              message: `Temp file cleanup not needed: ${file.path}`,
              context: {
                productId,
                imageType,
                fileName: file.originalname,
              },
            });
          }
        }
      }

      throw error;
    }
  }

  async getProductImages(
    productId: bigint,
    type?: ImageType,
    limit = 20,
    offset = 0,
  ) {
    return this.prisma.product_images.findMany({
      where: {
        product_id: productId,
        is_deleted: false,
        ...(type && { image_type: type }),
      },
      orderBy: { order: 'asc' },
      take: limit,
      skip: offset,
    });
  }

  async deleteImage(imageId: bigint, userId: bigint) {
    const image = await this.prisma.product_images.findUnique({
      where: { id: Number(imageId) },
    });

    if (!image) {
      throw new Error('Image not found');
    }

    // Soft delete in database
    await this.prisma.product_images.update({
      where: { id: Number(imageId) },
      data: {
        is_deleted: true,
        deleted_by: userId,
        deleted_at: new Date(),
      },
    });

    // Delete physical file
    try {
      await fs.unlink(image.img_url);
    } catch (error) {
      console.warn(`Failed to delete physical file: ${image.img_url}`);
    }
  }

  private async getMaxImageOrder(
    productId: bigint,
    imageType: ImageType,
    transaction?: any,
  ): Promise<number> {
    const prisma = transaction || this.prisma;

    const result = await prisma.product_images.findFirst({
      where: {
        product_id: productId,
        image_type: imageType,
        is_deleted: false,
      },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return result?.order || 0;
  }
}
