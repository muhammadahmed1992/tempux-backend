import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/prisma.service';
import {
  SearchRequestDTO,
  SearchResponseDTO,
  SearchResultDTO,
} from '@DTO/search-response.dto';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchBrandsAndmodels(
    searchDto: SearchRequestDTO,
  ): Promise<SearchResponseDTO> {
    const { query, type = 'all', limit = 20, page = 1 } = searchDto;
    const searchQuery = `%${query.toLowerCase()}%`;
    const skip = (page - 1) * limit;

    let brands: SearchResultDTO[] = [];
    let models: SearchResultDTO[] = [];

    // Search brands if type is 'all' or 'brand'
    if (type === 'all' || type === 'brand') {
      const brandResults = await this.prisma.brand.findMany({
        where: {
          AND: [
            { is_deleted: false },
            {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { title: { contains: searchQuery, mode: 'insensitive' } },
              ],
            },
          ],
        },
        select: {
          id: true,
          title: true,
          image_url: true,
        },
        orderBy: {
          title: 'asc',
        },
        take: limit,
        skip: skip,
      });

      brands = brandResults.map((brand) => ({
        id: brand.id,
        title: brand.title,
        type: 'brand' as const,
        image_url: brand.image_url,
        redirect_url: `/brands/${brand.id}`,
      }));
    }

    // Search models if type is 'all' or 'model'
    if (type === 'all' || type === 'model') {
      const modelResults = await this.prisma.model.findMany({
        where: {
          AND: [
            { is_deleted: false },
            {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { title: { contains: searchQuery, mode: 'insensitive' } },
              ],
            },
          ],
        },
        select: {
          id: true,
          title: true,
          image_url: true,
          brand_id: true,
          brand: {
            select: {
              title: true,
            },
          },
        },
        orderBy: {
          title: 'asc',
        },
        take: limit,
        skip: skip,
      });

      models = modelResults.map((model) => ({
        id: model.id,
        title: model.title,
        type: 'model' as const,
        image_url: model.image_url,
        brand_id: model.brand_id,
        brand_title: model.brand.title,
        redirect_url: `/brands/${model.brand_id}/models/${model.id}`,
      }));
    }

    const total_results = brands.length + models.length;

    return {
      brands,
      models,
      total_results,
    };
  }

  async searchBrandsOnly(query: string): Promise<SearchResultDTO[]> {
    const searchQuery = `%${query.toLowerCase()}%`;

    const brandResults = await this.prisma.brand.findMany({
      where: {
        AND: [
          { is_deleted: false },
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { title: { contains: searchQuery, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        image_url: true,
      },
      orderBy: {
        title: 'asc',
      },
    });

    return brandResults.map((brand) => ({
      id: brand.id,
      title: brand.title,
      type: 'brand' as const,
      image_url: brand.image_url,
      redirect_url: `/brands/${brand.id}`,
    }));
  }

  async searchmodelsOnly(query: string): Promise<SearchResultDTO[]> {
    const searchQuery = `%${query.toLowerCase()}%`;

    const modelResults = await this.prisma.model.findMany({
      where: {
        AND: [
          { is_deleted: false },
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { title: { contains: searchQuery, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        image_url: true,
        brand_id: true,
        brand: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        title: 'asc',
      },
    });

    return modelResults.map((model) => ({
      id: model.id,
      title: model.title,
      type: 'model' as const,
      image_url: model.image_url,
      brand_id: model.brand_id,
      brand_title: model.brand.title,
      redirect_url: `/brands/${model.brand_id}/models/${model.id}`,
    }));
  }
}
