import { Controller, Get, Query, HttpStatus } from '@nestjs/common';
import { ListingService } from '@Common/services/listing.service';
import {
  CategoryListingRequestDTO,
  CategoryListingResponseDTO,
} from '@DTO/category-listing.dto';
import {
  BrandListingRequestDTO,
  BrandListingResponseDTO,
} from '@DTO/brand-listing.dto';
import ResponseHelper from '@Helper/response-helper';
import ApiResponse from '@Helper/api-response';

@Controller('listing')
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  /**
   * Get complete category listing with top categories and alphabetical grouping
   */
  @Get('categories')
  async getCategoryListing(
    @Query() query: CategoryListingRequestDTO,
  ): Promise<ApiResponse<CategoryListingResponseDTO>> {
    try {
      const result = await this.listingService.getCompleteCategoryListing(
        query,
      );

      return ResponseHelper.CreateResponse<CategoryListingResponseDTO>(
        'Category listing retrieved successfully',
        result,
        HttpStatus.OK,
      );
    } catch (error) {
      return ResponseHelper.CreateResponse<CategoryListingResponseDTO>(
        'Failed to retrieve category listing',
        {
          top_categories: [],
          alphabetical_categories: {},
          total_categories: 0,
          total_top_categories: 0,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get only top categories
   */
  @Get('categories/top')
  async getTopCategories(
    @Query('limit') limit?: string,
    @Query('featured_only') featuredOnly?: string,
  ): Promise<ApiResponse<any[]>> {
    try {
      const limitNum = limit ? parseInt(limit) : 8;
      const featuredOnlyBool = featuredOnly === 'true';

      const result = await this.listingService.getTopCategories(
        limitNum,
        featuredOnlyBool,
      );

      return ResponseHelper.CreateResponse<any[]>(
        'Top categories retrieved successfully',
        result,
        HttpStatus.OK,
      );
    } catch (error) {
      return ResponseHelper.CreateResponse<any[]>(
        'Failed to retrieve top categories',
        [],
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get only alphabetical categories
   */
  @Get('categories/alphabetical')
  async getAlphabeticalCategories(
    @Query('include_product_count') includeProductCount?: string,
  ): Promise<ApiResponse<any>> {
    try {
      const includeProductCountBool = includeProductCount !== 'false';

      const result = await this.listingService.getAlphabeticalCategories(
        includeProductCountBool,
      );

      return ResponseHelper.CreateResponse<any>(
        'Alphabetical categories retrieved successfully',
        result,
        HttpStatus.OK,
      );
    } catch (error) {
      return ResponseHelper.CreateResponse<any>(
        'Failed to retrieve alphabetical categories',
        {},
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get complete brand listing with top brands and alphabetical grouping
   */
  @Get('brands')
  async getBrandListing(
    @Query() query: BrandListingRequestDTO,
  ): Promise<ApiResponse<BrandListingResponseDTO>> {
    try {
      const result = await this.listingService.getCompleteBrandListing(query);

      return ResponseHelper.CreateResponse<BrandListingResponseDTO>(
        'Brand listing retrieved successfully',
        result,
        HttpStatus.OK,
      );
    } catch (error) {
      return ResponseHelper.CreateResponse<BrandListingResponseDTO>(
        'Failed to retrieve brand listing',
        {
          top_brands: [],
          alphabetical_brands: {},
          total_brands: 0,
          total_top_brands: 0,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get only top brands
   */
  @Get('brands/top')
  async getTopBrands(
    @Query('limit') limit?: string,
    @Query('featured_only') featuredOnly?: string,
  ): Promise<ApiResponse<any[]>> {
    try {
      const limitNum = limit ? parseInt(limit) : 8;
      const featuredOnlyBool = featuredOnly === 'true';

      const result = await this.listingService.getTopBrands(
        limitNum,
        featuredOnlyBool,
      );

      return ResponseHelper.CreateResponse<any[]>(
        'Top brands retrieved successfully',
        result,
        HttpStatus.OK,
      );
    } catch (error) {
      return ResponseHelper.CreateResponse<any[]>(
        'Failed to retrieve top brands',
        [],
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get only alphabetical brands
   */
  @Get('brands/alphabetical')
  async getAlphabeticalBrands(
    @Query('include_product_count') includeProductCount?: string,
    @Query('include_collection_count') includeCollectionCount?: string,
  ): Promise<ApiResponse<any>> {
    try {
      const includeProductCountBool = includeProductCount !== 'false';
      const includeCollectionCountBool = includeCollectionCount !== 'false';

      const result = await this.listingService.getAlphabeticalBrands(
        includeProductCountBool,
        includeCollectionCountBool,
      );

      return ResponseHelper.CreateResponse<any>(
        'Alphabetical brands retrieved successfully',
        result,
        HttpStatus.OK,
      );
    } catch (error) {
      return ResponseHelper.CreateResponse<any>(
        'Failed to retrieve alphabetical brands',
        {},
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
