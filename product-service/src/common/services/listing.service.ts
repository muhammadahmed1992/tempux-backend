import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/prisma.service';

@Injectable()
export class ListingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get top categories with product counts
   */
  async getTopCategories(limit: number = 8, featuredOnly: boolean = false) {
    const whereClause = {
      is_deleted: false,
      ...(featuredOnly && { order: { not: null } }),
    };

    const topCategories = await this.prisma.category.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        image_url: true,
        order: true,
        _count: {
          select: {
            product: true,
          },
        },
      },
      orderBy: [{ order: 'asc' }, { title: 'asc' }],
      take: limit,
    });

    return topCategories.map((category) => ({
      id: category.id,
      title: category.title,
      image_url: category.image_url,
      order: category.order || 0,
      product_count: category._count.product,
      redirect_url: `/categories/${category.id}`,
      featured: category.order !== null,
    }));
  }

  /**
   * Get all categories grouped alphabetically
   */
  async getAlphabeticalCategories(includeProductCount: boolean = true) {
    const selectClause = {
      id: true,
      title: true,
      image_url: true,
      order: true,
      ...(includeProductCount && {
        _count: {
          select: {
            product: true,
          },
        },
      }),
    };

    const categories = await this.prisma.category.findMany({
      where: {
        is_deleted: false,
      },
      select: selectClause,
      orderBy: {
        title: 'asc',
      },
    });

    const alphabeticalGroups: { [key: string]: any[] } = {};

    categories.forEach((category) => {
      const firstLetter = category.title.charAt(0).toUpperCase();
      if (!alphabeticalGroups[firstLetter]) {
        alphabeticalGroups[firstLetter] = [];
      }

      const categoryItem = {
        id: category.id,
        title: category.title,
        image_url: category.image_url,
        order: category.order,
        product_count: includeProductCount
          ? category._count?.product
          : undefined,
        redirect_url: `/categories/${category.id}`,
      };

      alphabeticalGroups[firstLetter].push(categoryItem);
    });

    return alphabeticalGroups;
  }

  /**
   * Get top brands with product and model counts
   */
  async getTopBrands(limit: number = 8, featuredOnly: boolean = false) {
    const whereClause = {
      is_deleted: false,
      ...(featuredOnly && { order: { not: null } }),
    };

    const topBrands = await this.prisma.brand.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        image_url: true,
        order: true,
        _count: {
          select: {
            product: true,
            model: true,
          },
        },
      },
      orderBy: [{ order: 'asc' }, { title: 'asc' }],
      take: limit,
    });

    return topBrands.map((brand) => ({
      id: brand.id,
      title: brand.title,
      image_url: brand.image_url,
      order: brand.order || 0,
      product_count: brand._count.product,
      model_count: brand._count.model,
      redirect_url: `/brands/${brand.id}`,
      featured: brand.order !== null,
    }));
  }

  /**
   * Get all brands grouped alphabetically
   */
  async getAlphabeticalBrands(
    includeProductCount: boolean = true,
    includeModelCount: boolean = true,
  ) {
    const selectClause = {
      id: true,
      title: true,
      image_url: true,
      order: true,
      ...(includeProductCount && {
        _count: {
          select: {
            product: true,
          },
        },
      }),
      ...(includeModelCount && {
        _count: {
          select: {
            model: true,
          },
        },
      }),
    };

    const brands = await this.prisma.brand.findMany({
      where: {
        is_deleted: false,
      },
      select: selectClause,
      orderBy: {
        title: 'asc',
      },
    });

    const alphabeticalGroups: { [key: string]: any[] } = {};

    brands.forEach((brand) => {
      const firstLetter = brand.title.charAt(0).toUpperCase();
      if (!alphabeticalGroups[firstLetter]) {
        alphabeticalGroups[firstLetter] = [];
      }

      const brandItem = {
        id: brand.id,
        title: brand.title,
        image_url: brand.image_url,
        order: brand.order,
        product_count: includeProductCount ? brand._count?.product : undefined,
        model_count: includeModelCount ? brand._count?.model : undefined,
        redirect_url: `/brands/${brand.id}`,
      };

      alphabeticalGroups[firstLetter].push(brandItem);
    });

    return alphabeticalGroups;
  }

  /**
   * Get complete category listing (top + alphabetical)
   */
  async getCompleteCategoryListing(request: any) {
    const {
      include_product_count = true,
      limit_top_categories = 8,
      featured_only = false,
    } = request;

    const [topCategories, alphabeticalCategories] = await Promise.all([
      this.getTopCategories(limit_top_categories, featured_only),
      this.getAlphabeticalCategories(include_product_count),
    ]);

    const totalCategories = Object.values(alphabeticalCategories).reduce(
      (total, categories) => total + categories.length,
      0,
    );

    return {
      top_categories: topCategories,
      alphabetical_categories: alphabeticalCategories,
      total_categories: totalCategories,
      total_top_categories: topCategories.length,
    };
  }

  /**
   * Get complete brand listing (top + alphabetical)
   */
  async getCompleteBrandListing(request: any) {
    const {
      include_product_count = true,
      include_model_count = true,
      limit_top_brands = 8,
      featured_only = false,
    } = request;

    const [topBrands, alphabeticalBrands] = await Promise.all([
      this.getTopBrands(limit_top_brands, featured_only),
      this.getAlphabeticalBrands(include_product_count, include_model_count),
    ]);

    const totalBrands = Object.values(alphabeticalBrands).reduce(
      (total, brands) => total + brands.length,
      0,
    );

    return {
      top_brands: topBrands,
      alphabetical_brands: alphabeticalBrands,
      total_brands: totalBrands,
      total_top_brands: topBrands.length,
    };
  }
}
