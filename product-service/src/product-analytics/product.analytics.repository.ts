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
   * @param variantId Particular product variant which is being viewed by the user
   * @returns The unique count against this passed product and variant within cut-off time i.e in last 48 hours.
   */
  async getViewershipUniqueCount(productId: bigint, variantId?: bigint) {
    const viewershipHours = StaticConfiguration.viewershipWindowHours;
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - viewershipHours);
    const res = await this.findMany({
      where: {
        product_id: productId,
        product_variant_id: variantId,
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

  async getUserRecommendations(userId: bigint, limit = 4) {
    // 1. Get recent views for the user
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
          include: { brand: true, category: true, productVariants: true },
        },
        productVariant: true,
      },
    });

    if (!views.length) return [];

    // 2. Count brands & categories + collect price points
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

      // extract numeric price if variant exists
      const price = this.getNumericPrice(v.productVariant?.price);
      if (price) pricePoints.push(price);
    });

    // Most viewed brand & category
    const topBrandId = Object.entries(brandCount).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0];
    const topCategoryId = Object.entries(categoryCount).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0];

    const avgPrice =
      pricePoints.reduce((sum, p) => sum + p, 0) / (pricePoints.length || 1);

    const lowerBound = avgPrice * 0.8;
    const upperBound = avgPrice * 1.2;

    const recommendations: any[] = [];
    const excludeIds = views.map((v) => v.product_id);

    // ---- 3. Brand priority ----
    if (topBrandId) {
      const brandMatches = await this.prisma.product.findMany({
        where: {
          brand_id: Number(topBrandId),
          id: { notIn: excludeIds },
          is_deleted: false,
        },
        take: limit,
        include: { productVariants: true, brand: true, category: true },
      });
      recommendations.push(...brandMatches);
    }

    if (recommendations.length >= limit) {
      return recommendations
        .slice(0, limit)
        .map(this.mapProductToRecommendation);
    }

    // ---- 4. Category fallback ----
    if (topCategoryId) {
      const catMatches = await this.prisma.product.findMany({
        where: {
          category_id: Number(topCategoryId),
          id: { notIn: excludeIds },
          is_deleted: false,
        },
        take: limit - recommendations.length,
        include: { productVariants: true, brand: true, category: true },
      });
      recommendations.push(...catMatches);
    }

    if (recommendations.length >= limit) {
      return recommendations
        .slice(0, limit)
        .map(this.mapProductToRecommendation);
    }

    // ---- 5. Price fallback ----
    const priceMatches = await this.prisma.product.findMany({
      where: {
        id: { notIn: excludeIds },
        is_deleted: false,
        productVariants: {
          some: {
            price: { gte: lowerBound, lte: upperBound },
          },
        },
      },
      take: limit - recommendations.length,
      include: { productVariants: true, brand: true, category: true },
    });
    recommendations.push(...priceMatches);

    // ---- Map before returning ----
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
    // pick cheapest variant
    const variant = product.productVariants?.reduce(
      (min: { price: number }, v: { price: number }) => {
        const price = this.getNumericPrice(v.price);
        const minPrice = this.getNumericPrice(min.price);
        return price! < minPrice! ? v : min;
      },
      product.productVariants?.[0],
    );

    return {
      itemId: product.id.toString(),
      productId: product.product_public_id,
      slug: product.product_slug,
      title: product.title,
      description: product.description,
      symb: '$', // you could map from currency_id if needed
      image_url: variant?.base_image_url || null,
      price: this.getNumericPrice(variant?.price)?.toFixed(2) || '0.00',
      isFavorite: null, // hook into favorites table if available
      tags: [product.brand?.title, product.category?.title].filter(Boolean),
    };
  };
}
