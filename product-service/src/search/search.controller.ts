import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { GetAllQueryDTO } from '@DTO/search.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly SearchService: SearchService) {}

  @Get()
  async getAll(@Query() queryDto: GetAllQueryDTO) {
    return this.SearchService.getAllPagedData(queryDto);
  }

  @Get('search')
  async search(@Query() searchParams: any) {
    // Extract search parameters matching your filter structure
    const filters = this.parseFilters(searchParams.filter);
    const query = filters?.title?.contains || searchParams.query;
    const type = searchParams.type || 'all';
    const page = parseInt(searchParams.page) || 1;
    const pageSize = parseInt(searchParams.pageSize) || 20;

    if (query && query.trim().length > 0) {
      // Use fast UNION search for simple queries
      const results = await this.SearchService.fastSearch(query, pageSize);
      return {
        data: results,
        totalCount: results.length,
        pageNumber: page,
        pageSize,
        numberOfTotalPages: Math.ceil(results.length / pageSize),
      };
    }

    // Use regular method for complex queries
    return this.SearchService.searchBrandsModelsCategories({
      query,
      type,
      page,
      limit: pageSize,
    });
  }

  private parseFilters(filterArray: any[]): any {
    if (!filterArray || !Array.isArray(filterArray)) return {};

    const filters = {};
    filterArray.forEach((filter, index) => {
      if (filter && typeof filter === 'object') {
        Object.assign(filters, filter);
      }
    });

    return filters;
  }
}
