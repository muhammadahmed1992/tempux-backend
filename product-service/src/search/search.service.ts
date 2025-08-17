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

  async searchBrandsAndCollections(
    searchDto: SearchRequestDTO,
  ): Promise<SearchResponseDTO> {
    const { query, type = 'all', limit = 20, page = 1 } = searchDto;
    const searchQuery = `%${query.toLowerCase()}%`;
    const skip = (page - 1) * limit;

    let brands: SearchResultDTO[] = [];
    let collections: SearchResultDTO[] = [];

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

    // Search collections if type is 'all' or 'collection'
    if (type === 'all' || type === 'collection') {
      const collectionResults = await this.prisma.collection.findMany({
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

      collections = collectionResults.map((collection) => ({
        id: collection.id,
        title: collection.title,
        type: 'collection' as const,
        image_url: collection.image_url,
        brand_id: collection.brand_id,
        brand_title: collection.brand.title,
        redirect_url: `/brands/${collection.brand_id}/collections/${collection.id}`,
      }));
    }

    const total_results = brands.length + collections.length;

    return {
      brands,
      collections,
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

  async searchCollectionsOnly(query: string): Promise<SearchResultDTO[]> {
    const searchQuery = `%${query.toLowerCase()}%`;

    const collectionResults = await this.prisma.collection.findMany({
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

    return collectionResults.map((collection) => ({
      id: collection.id,
      title: collection.title,
      type: 'collection' as const,
      image_url: collection.image_url,
      brand_id: collection.brand_id,
      brand_title: collection.brand.title,
      redirect_url: `/brands/${collection.brand_id}/collections/${collection.id}`,
    }));
  }
}
