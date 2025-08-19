import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/prisma.service';
import ApiResponse from '@Helper/api-response';
import ResponseHelper from '@Helper/response-helper';
import Constants from '@Helper/constants';
import { BrandRepository } from '@Brand/brand.repository';
import { ModelRepository } from '../model/model.repository';
import { CategoryRepository } from '@Category/category.repository';
import {
  GetAllQueryDTO,
  SearchResultDTO,
} from '@DTO/search.dto';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly brandRepository: BrandRepository,
    private readonly modelRepository: ModelRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async getAllPagedData(
    queryDto: GetAllQueryDTO,
  ): Promise<ApiResponse<SearchResultDTO[]>> {
    const { type = 'all', page = 1, pageSize = 20 } = queryDto;

    // Parse filters to extract search query
    const searchQuery = this.extractSearchQuery(queryDto);
    const updatedQueryDto = { ...queryDto, query: searchQuery };

    try {
      // Route to specific entity if type is specified
      if (type !== 'all') {
        return this.getSingleEntityType(type, updatedQueryDto);
      }

      // Get all entity types in parallel
      return this.getAllEntitiesParallel(updatedQueryDto);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch  data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private extractSearchQuery(queryDto: GetAllQueryDTO): string | undefined {
    // Check direct query first
    if (queryDto.query) return queryDto.query;

    // Parse filter array structure like filter[0][title][contains]=Rolex
    if (queryDto.filter && Array.isArray(queryDto.filter)) {
      for (const filter of queryDto.filter) {
        if (filter?.title?.contains) {
          return filter.title.contains;
        }
      }
    }

    return undefined;
  }

  private async getSingleEntityType(
    type: 'brand' | 'model' | 'category',
    queryDto: GetAllQueryDTO,
  ) {
    const { page, pageSize, where, orderBy, select, query } = queryDto;

    // Build search conditions
    const searchWhere = this.buildSearchWhere(query, where);

    let result;

    switch (type) {
      case 'brand':
        result = await this.brandRepository.findManyPaginated(
          page,
          pageSize,
          searchWhere,
          select,
          orderBy,
        );
        break;
      case 'model':
        result = await this.modelRepository.findManyPaginated(
          page,
          pageSize,
          searchWhere,
          select || {
            id: true,
            title: true,
            image_url: true,
            brand: { select: { id: true, title: true } }
          },
          orderBy,
        );
        break;
      case 'category':
        result = await this.categoryRepository.findManyPaginated(
          page,
          pageSize,
          searchWhere,
          select,
          orderBy,
        );
        break;
    }

    const transformedData = this.transformToFormat(result.data, type);

    return ResponseHelper.CreateResponse<SearchResultDTO[]>(
      Constants.DATA_SUCCESS,
      transformedData,
      HttpStatus.OK,
      {
        pageNumber: page,
        pageSize,
        totalCount: result.totalCount,
        numberOfTotalPages: Math.ceil(result.totalCount / pageSize),
      },
    );
  }

  private async getAllEntitiesParallel(queryDto: GetAllQueryDTO) {
    const { page, pageSize, where, orderBy, select, query } = queryDto;

    const searchWhere = this.buildSearchWhere(query, where);

    // Calculate items per entity type for even distribution
    const itemsPerType = Math.ceil(pageSize / 3);

    const [brandResult, modelResult, categoryResult] = await Promise.all([
      this.brandRepository.findManyPaginated(
        page,
        itemsPerType,
        searchWhere,
        select,
        orderBy,
      ),
      this.modelRepository.findManyPaginated(
        page,
        itemsPerType,
        searchWhere,
        select || {
          id: true,
          title: true,
          image_url: true,
          brand: { select: { id: true, title: true } }
        },
        orderBy,
      ),
      this.categoryRepository.findManyPaginated(
        page,
        itemsPerType,
        searchWhere,
        select,
        orderBy,
      ),
    ]);

    // Transform each result to  format
    const brands = this.transformToFormat(brandResult.data, 'brand');
    const models = this.transformToFormat(modelResult.data, 'model');
    const categories = this.transformToFormat(categoryResult.data, 'category');

    // Combine and sort all results
    const allData = [...brands, ...models, ...categories];
    const sortedData = this.sortResults(allData, orderBy);

    // Apply pagination to combined results
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = sortedData.slice(startIndex, endIndex);

    const totalCount = brandResult.totalCount + modelResult.totalCount + categoryResult.totalCount;

    return ResponseHelper.CreateResponse<SearchResultDTO[]>(
      Constants.DATA_SUCCESS,
      paginatedData,
      HttpStatus.OK,
      {
        pageNumber: page,
        pageSize,
        totalCount,
        numberOfTotalPages: Math.ceil(totalCount / pageSize),
      },
    );
  }

  private buildSearchWhere(query?: string, baseWhere?: object) {
    const searchCondition = query ? {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
      ],
    } : {};

    return {
      AND: [
        { is_deleted: false },
        searchCondition,
        ...(baseWhere ? [baseWhere] : []),
      ],
    };
  }

  private transformToFormat(
    data: any[],
    type: 'brand' | 'model' | 'category',
  ): SearchResultDTO[] {
    return data.map((item) => ({
      id: item.id,
      title: item.title,
      type,
      image_url: item.image_url,
      brand_id: type === 'model' ? item.brand?.id : undefined,
      brand_title: type === 'model' ? item.brand?.title : undefined,
      category_id: type === 'category' ? item.id : undefined,
      category_title: type === 'category' ? item.title : undefined,
      parent_category_id: type === 'category' ? item.parent_id : undefined,
      created_at: item.created_at,
      updated_at: item.updated_at,
      redirect_url: this.generateRedirectUrl(type, item),
    }));
  }

  private sortResults(data: SearchResultDTO[], orderBy?: object) {
    if (!orderBy) {
      // Default sort: brands first, then models, then categories, all by created_at desc
      return data.sort((a, b) => {
        const typeOrder = { brand: 1, model: 2, category: 3 };
        const typeComparison = typeOrder[a.type] - typeOrder[b.type];
        if (typeComparison !== 0) return typeComparison;

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }

    // Handle custom sorting
    const sortField = Object.keys(orderBy)[0];
    const sortDirection = Object.values(orderBy)[0] as 'asc' | 'desc';

    return data.sort((a, b) => {
      const aValue = a[sortField as keyof SearchResultDTO];
      const bValue = b[sortField as keyof SearchResultDTO];

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  }

  private generateRedirectUrl(type: string, item: any): string {
    switch (type) {
      case 'brand':
        return `/brands/${item.id}`;
      case 'model':
        return `/brands/${item.brand?.id || item.brand_id}/models/${item.id}`;
      case 'category':
        return `/categories/${item.id}`;
      default:
        return '/';
    }
  }

  // Fast search method using UNION (only for simple search scenarios)
  async fastSearch(query: string, limit: number = 20): Promise<SearchResultDTO[]> {
    if (!query || query.trim().length === 0) return [];

    const searchTerm = `%${query.toLowerCase()}%`;

    const result = await this.prisma.$queryRaw`
      (SELECT id::text, title, 'brand'::text as type, image_url,
              NULL::text as brand_id, NULL::text as brand_title,
              created_at, updated_at
       FROM brands
       WHERE is_deleted = false AND LOWER(title) LIKE ${searchTerm}
       ORDER BY title ASC
       LIMIT ${Math.ceil(limit / 3)})

      UNION ALL

      (SELECT m.id::text, m.title, 'model'::text as type, m.image_url,
              m.brand_id::text, b.title as brand_title,
              m.created_at, m.updated_at
       FROM models m
       LEFT JOIN brands b ON m.brand_id = b.id
       WHERE m.is_deleted = false AND LOWER(m.title) LIKE ${searchTerm}
       ORDER BY m.title ASC
       LIMIT ${Math.ceil(limit / 3)})

      UNION ALL

      (SELECT id::text, title, 'category'::text as type, image_url,
              NULL::text as brand_id, NULL::text as brand_title,
              created_at, updated_at
       FROM categories
       WHERE is_deleted = false AND LOWER(title) LIKE ${searchTerm}
       ORDER BY title ASC
       LIMIT ${Math.ceil(limit / 3)})

      ORDER BY type, title
      LIMIT ${limit}
    `;

    return this.transformResults(result as any[]);
  }

  private transformResults(rawData: any[]): SearchResultDTO[] {
    return rawData.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type as 'brand' | 'model' | 'category',
      image_url: item.image_url,
      brand_id: item.brand_id,
      brand_title: item.brand_title,
      category_id: item.type === 'category' ? item.id : undefined,
      category_title: item.type === 'category' ? item.title : undefined,
      parent_category_id: undefined,
      created_at: item.created_at,
      updated_at: item.updated_at,
      redirect_url: this.generateRedirectUrl(item.type, item),
    }));
  }

  // Legacy compatibility method
  async searchBrandsModelsCategories(searchDto: {
    query?: string;
    type?: 'all' | 'brand' | 'model' | 'category';
    limit?: number;
    page?: number;
  }) {
    // Use fast search for simple queries
    if (searchDto.query && searchDto.query.trim().length > 0) {
      const results = await this.fastSearch(searchDto.query, searchDto.limit || 20);

      return {
        brands: results.filter(r => r.type === 'brand'),
        models: results.filter(r => r.type === 'model'),
        categories: results.filter(r => r.type === 'category'),
      };
    }

    // Use regular paginated method for complex queries
    const queryDto: GetAllQueryDTO = {
      type: searchDto.type || 'all',
      pageSize: searchDto.limit || 20,
      page: searchDto.page || 1,
    };

    const response = await this.getAllPagedData(queryDto);

    return {
      brands: response.data.filter(r => r.type === 'brand'),
      models: response.data.filter(r => r.type === 'model'),
      categories: response.data.filter(r => r.type === 'category'),
    };
  }
}
