// src/product-listings/product-listings.service.ts
import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductMinimalResponseDto } from './dto/product-minimal.response';
import ApiResponse from '@Helper/api-response';
import ResponseHelper from '@Helper/response-helper';
import { ProductListingResponse } from './dto/product-listing-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ProductListingsService {
  constructor(private prisma: PrismaService) {}

  async searchMinimal(
    query: string,
  ): Promise<ApiResponse<ProductMinimalResponseDto[]>> {
    if (!query || query.trim().length < 3) {
      return ResponseHelper.CreateResponse(
        'Search query must be at least 3 characters long',
        [],
        HttpStatus.BAD_REQUEST,
      );
    }

    const products = await this.prisma.product_listings.findMany({
      where: {
        OR: [
          { brand: { contains: query, mode: 'insensitive' } },
          { referenceNo: { contains: query, mode: 'insensitive' } },
          { modelName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        brand: true,
        modelName: true,
        referenceNo: true,
        caseMaterial: true,
        dialColor: true,
        caseDiameterMm: true,
      },
      take: 5,
    });

    if (!products || products.length === 0) {
      return ResponseHelper.CreateResponse(``, [], HttpStatus.NOT_FOUND);
    }

    return ResponseHelper.CreateResponse('', products, HttpStatus.OK);
  }
  async getById(
    id: number,
  ): Promise<ApiResponse<ProductListingResponse | null>> {
    const product = await this.prisma.product_listings.findUnique({
      where: { id },
    });

    return ResponseHelper.CreateResponse(
      'Product retrieved successfully',
      product,
      HttpStatus.OK,
    );
  }
}
