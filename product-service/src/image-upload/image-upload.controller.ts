import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  Query,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ParseIntPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ImageUploadService } from './image-upload.service';
import { ALLOWED_IMAGE_TYPES, ImageType } from './constants/image-types';
import { HeaderAuthGuard } from '@Auth/guards/auth-user-guard';
import { UserId } from '@Auth/decorators/userId.decorator';
import ResponseHelper from '@Helper/response-helper';
import { ImageUploadDto, GetImagesQueryDto } from '@DTO/image-upload.dto';

@Controller('images')
@UseGuards(HeaderAuthGuard)
export class ImageUploadController {
  constructor(private readonly imageUploadService: ImageUploadService) {}

  /**
   * Upload images for a product
   * POST /images/upload
   */
  @Post('upload')
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 images
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: ImageUploadDto,
    @UserId() userId: bigint,
  ) {
    try {
      // Validate uploaded files
      if (!files || files.length === 0) {
        throw new BadRequestException('No images provided');
      }

      // Validate required fields from body
      if (!body.product_id) {
        throw new BadRequestException('Product ID is required');
      }

      if (!body.imageType) {
        throw new BadRequestException('Image type is required');
      }

      // Parse and validate product_id
      let productId: bigint;
      try {
        productId = BigInt(body.product_id);
      } catch (error) {
        throw new BadRequestException('Invalid product ID format');
      }

      const type = body.imageType as ImageType;

      // Parse alt texts if provided
      let altTexts: string[] | undefined;
      if (body.altTexts) {
        try {
          altTexts =
            typeof body.altTexts === 'string'
              ? JSON.parse(body.altTexts)
              : body.altTexts;
        } catch (error) {
          throw new BadRequestException(
            'Invalid altTexts format. Expected JSON array.',
          );
        }
      }

      // Validate image type
      if (!Object.values(ALLOWED_IMAGE_TYPES).includes(type)) {
        throw new BadRequestException(
          `Invalid image type. Allowed types: ${Object.values(
            ALLOWED_IMAGE_TYPES,
          ).join(', ')}`,
        );
      }

      // Validate files exist and have paths (disk storage)
      for (const file of files) {
        if (!file.path) {
          throw new BadRequestException(
            `File path missing for: ${file.originalname}. Check disk storage configuration.`,
          );
        }

        if (file.size === 0) {
          throw new BadRequestException(
            `Empty file detected: ${file.originalname}`,
          );
        }
      }

      // Upload images
      const result = await this.imageUploadService.uploadProductImages(
        productId,
        type,
        files,
        altTexts,
        userId,
      );

      return ResponseHelper.CreateResponse(
        'Images uploaded successfully',
        {
          uploadSummary: {
            totalFiles: files.length,
            processedImages: result.processedImages,
            skippedImages: result.skippedImages,
            errors: result.errors,
          },
          imageIds: result.imageIds.map((id) => id.toString()), // Convert BigInt to string
        },
        HttpStatus.CREATED,
      );
    } catch (error: any) {
      console.error('Image upload error:', error);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        return ResponseHelper.CreateResponse(
          error.message,
          null,
          error.getStatus(),
        );
      }

      return ResponseHelper.CreateResponse(
        'Failed to upload images',
        { error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get images for a product
   * GET /images/product/:product_id
   */
  @Get('product/:productId')
  async getProductImages(
    @Param('product_id', ParseIntPipe) productId: number,
    @Query() query: GetImagesQueryDto,
  ) {
    try {
      const images = await this.imageUploadService.getProductImages(
        BigInt(productId),
        query.type,
        100,
        0,
      );

      return ResponseHelper.CreateResponse(
        'Images retrieved successfully',
        {
          images: images.map((image) => ({
            ...image,
            id: image.id.toString(),
            product_id: image.product_id?.toString(),
            created_by: image.created_by.toString(),
            updated_by: image.updated_by?.toString(),
            deleted_by: image.deleted_by?.toString(),
          })),
          total: images.length,
        },
        HttpStatus.OK,
      );
    } catch (error: any) {
      console.error('Get images error:', error);
      return ResponseHelper.CreateResponse(
        'Failed to retrieve images',
        { error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete an image
   * DELETE /images/:imageId
   */
  @Delete(':imageId')
  async deleteImage(
    @Param('imageId', ParseIntPipe) imageId: number,
    @UserId() userId: bigint,
  ) {
    try {
      await this.imageUploadService.deleteImage(BigInt(imageId), userId);

      return ResponseHelper.CreateResponse(
        'Image deleted successfully',
        null,
        HttpStatus.OK,
      );
    } catch (error: any) {
      console.error('Delete image error:', error);

      if (error instanceof NotFoundException) {
        return ResponseHelper.CreateResponse(
          error.message,
          null,
          HttpStatus.NOT_FOUND,
        );
      }

      return ResponseHelper.CreateResponse(
        'Failed to delete image',
        { error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
