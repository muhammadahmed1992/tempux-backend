import { Controller, Get, Query, HttpStatus } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchRequestDTO, SearchResponseDTO } from '@DTO/search-response.dto';
import ResponseHelper from '@Helper/response-helper';
import ApiResponse from '@Helper/api-response';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @Query() searchDto: SearchRequestDTO,
  ): Promise<ApiResponse<SearchResponseDTO>> {
    try {
      const results = await this.searchService.searchBrandsAndCollections(
        searchDto,
      );

      return ResponseHelper.CreateResponse<SearchResponseDTO>(
        'Search completed successfully',
        results,
        HttpStatus.OK,
      );
    } catch (error) {
      return ResponseHelper.CreateResponse<SearchResponseDTO>(
        'Search failed',
        {
          brands: [],
          collections: [],
          total_results: 0,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('brands')
  async searchBrands(
    @Query('query') query: string,
  ): Promise<ApiResponse<any[]>> {
    try {
      if (!query || query.trim().length === 0) {
        return ResponseHelper.CreateResponse<any[]>(
          'Query parameter is required',
          [],
          HttpStatus.BAD_REQUEST,
        );
      }

      const results = await this.searchService.searchBrandsOnly(query);

      return ResponseHelper.CreateResponse<any[]>(
        'Brand search completed successfully',
        results,
        HttpStatus.OK,
      );
    } catch (error) {
      return ResponseHelper.CreateResponse<any[]>(
        'Brand search failed',
        [],
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('collections')
  async searchCollections(
    @Query('query') query: string,
  ): Promise<ApiResponse<any[]>> {
    try {
      if (!query || query.trim().length === 0) {
        return ResponseHelper.CreateResponse<any[]>(
          'Query parameter is required',
          [],
          HttpStatus.BAD_REQUEST,
        );
      }

      const results = await this.searchService.searchCollectionsOnly(query);

      return ResponseHelper.CreateResponse<any[]>(
        'Collection search completed successfully',
        results,
        HttpStatus.OK,
      );
    } catch (error) {
      return ResponseHelper.CreateResponse<any[]>(
        'Collection search failed',
        [],
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
