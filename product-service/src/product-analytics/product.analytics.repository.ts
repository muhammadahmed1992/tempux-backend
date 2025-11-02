import { Injectable } from '@nestjs/common';
import { Prisma, product_analytics } from '@prisma/client';
import { BaseRepository } from '@Common/db/base.repository';
import { PrismaService } from '@Prisma/prisma.service';
import { StaticConfiguration } from '@Common/static.configurations.keys';

@Injectable()
export class ProductAnalyticsRepository extends BaseRepository<
  product_analytics,
  Prisma.product_analyticsCreateInput,
  Prisma.product_analyticsUpdateInput,
  Prisma.product_analyticsWhereUniqueInput,
  Prisma.product_analyticsWhereInput,
  Prisma.product_analyticsFindUniqueArgs,
  Prisma.product_analyticsFindManyArgs,
  Prisma.product_analyticsFindFirstArgs
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, prisma.product_analytics);
  }

  /**
   * @param productId Particular product which is being viewed by the user
   * @returns The unique count against this passed product within cut-off time i.e in last 48 hours.
   */
  async getViewershipUniqueCount(productId: bigint) {
    const viewershipHours = StaticConfiguration.viewershipWindowHours;
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - viewershipHours);
    const res = await this.findMany({
      where: {
        product_id: productId,
        viewed_at: {
          gte: cutoffTime,
        },
      },
      select: {
        user_id: true,
      },
      distinct: ['user_id'],
    });
    return res.length;
  }

  async getProductsExceedingViewLimit(sinceDate: Date, limit: number) {
    const result = await this.prisma.product_analytics.groupBy({
      by: ['product_id'],
      where: {
        created_at: {
          gte: sinceDate,
        },
      },
      _count: {
        product_id: true,
      },
      orderBy: {
        _count: {
          product_id: 'desc',
        },
      },
      take: limit,
    });

    return result.map((r) => ({
      productId: r.product_id,
      views: r._count.product_id,
    }));
  }

  async getUserRecommendations(userId: bigint, limit = 5) {
    const cutoffTime = new Date();
    cutoffTime.setHours(
      cutoffTime.getHours() - StaticConfiguration.viewershipWindowHours,
    );

    const views = await this.prisma.product_analytics.findMany({
      where: {
        user_id: userId,
        viewed_at: { gte: cutoffTime },
        is_deleted: false,
      },
      include: {
        product: {
          include: {
            brand: true,
            category: true,
            currency: true,
            productImages: true,
          },
        },
      },
    });

    // --- If no recent views, fallback to top products ---
    if (!views.length) {
      const topProducts = await this.prisma.product.findMany({
        where: { is_deleted: false },
        orderBy: { created_at: 'desc' }, // or orderBy: { popularity: "desc" } if you have analytics
        take: limit,
        include: {
          brand: true,
          category: true,
        },
      });

      return topProducts.map(this.mapProductToRecommendation);
    }

    // --- Count brands, categories, price points ---
    const brandCount: Record<number, number> = {};
    const categoryCount: Record<number, number> = {};
    const pricePoints: number[] = [];

    views.forEach((v) => {
      if (v.product.brand_id) {
        brandCount[v.product.brand_id] =
          (brandCount[v.product.brand_id] || 0) + 1;
      }
      if (v.product.category_id) {
        categoryCount[v.product.category_id] =
          (categoryCount[v.product.category_id] || 0) + 1;
      }
      const price = this.getNumericPrice(v.product.sales_price);
      if (price) pricePoints.push(price);
    });

    const totalBrands = Object.values(brandCount).reduce((a, b) => a + b, 0);
    const totalCategories = Object.values(categoryCount).reduce(
      (a, b) => a + b,
      0,
    );

    const avgPrice =
      pricePoints.reduce((sum, p) => sum + p, 0) / (pricePoints.length || 1);
    const lowerBound = avgPrice * 0.8;
    const upperBound = avgPrice * 1.2;

    const excludeIds = views.map((v) => v.product_id);
    const recommendations: any[] = [];

    // --- Weighted brand allocation ---
    for (const [brandId, count] of Object.entries(brandCount)) {
      const share = count / totalBrands; // e.g. 0.7 for 70%
      const take = Math.ceil(Math.max(1, Math.floor(limit * share)) / 2); // allocate slots

      const brandMatches = await this.prisma.product.findMany({
        where: {
          brand_id: Number(brandId),
          id: { notIn: excludeIds },
          is_deleted: false,
        },
        take,
        include: {
          brand: true,
          category: true,
        },
      });
      recommendations.push(...brandMatches);
    }

    // --- Weighted category allocation ---
    for (const [catId, count] of Object.entries(categoryCount)) {
      const share = count / totalCategories;
      const take = Math.max(1, Math.floor(limit * share));

      const catMatches = await this.prisma.product.findMany({
        where: {
          category_id: Number(catId),
          id: { notIn: excludeIds },
          is_deleted: false,
        },
        take: take - recommendations.length / 2,
        include: {
          brand: true,
          category: true,
        },
      });
      recommendations.push(...catMatches);
    }

    // --- Price fallback ---
    if (recommendations.length < limit) {
      const priceMatches = await this.prisma.product.findMany({
        where: {
          id: { notIn: excludeIds },
          is_deleted: false,
        },
        take: limit - recommendations.length,
        include: {
          brand: true,
          category: true,
        },
      });
      recommendations.push(...priceMatches);
    }

    return recommendations.slice(0, limit).map(this.mapProductToRecommendation);
  }

  // --- Helpers ---
  private getNumericPrice(priceObj: any): number | null {
    if (!priceObj) return null;

    // Prisma Decimal JSON format
    if (priceObj.d && Array.isArray(priceObj.d)) {
      return Number(priceObj.d[0]);
    }

    // Already a number or Decimal
    return Number(priceObj) || null;
  }

  private mapProductToRecommendation = (product: any) => {
    // pick cheapest item
    const item = product.productItems?.reduce(
      (min: { price: any }, v: { price: any }) => {
        const price = this.getNumericPrice(v.price);
        const minPrice = this.getNumericPrice(min.price);
        return price! < minPrice! ? v : min;
      },
      product.productItems?.[0],
    );

    return {
      productId: product.product_public_id,
      slug: product.product_slug,
      title: product.title,
      symb: item?.currency?.curr,
      image_url: item?.base_image_url || null,
      price: this.getNumericPrice(item?.price)?.toFixed(2),
      tags: [product.brand?.title, product.category?.title].filter(Boolean),
    };
  };
}
