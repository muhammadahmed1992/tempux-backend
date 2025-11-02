// src/product-listings/product-listings.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { ProductListingsService } from './product-listings.service';
import { ProductMinimalResponseDto } from './dto/product-minimal.response';
import ApiResponse from '@Helper/api-response';
import { SearchParamDto } from './dto/search-param.dto';
import { ProductListingResponse } from './dto/product-listing-response.dto';

@Controller('product-listing')
export class ProductListingsController {
  constructor(private readonly productService: ProductListingsService) {}

  @Get(':search')
  async searchMinimal(
    @Param() params: SearchParamDto,
  ): Promise<ApiResponse<ProductMinimalResponseDto[]>> {
    const query = decodeURIComponent(params.search);
    return this.productService.searchMinimal(query);
  }

  @Get(':id')
  async getById(
    @Param('id') id: number,
  ): Promise<ApiResponse<ProductListingResponse | null>> {
    return this.productService.getById(id);
  }
}
