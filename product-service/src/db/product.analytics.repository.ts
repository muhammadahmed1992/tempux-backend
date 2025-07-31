import { Injectable } from '@nestjs/common';
import { Prisma, product_analytics } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { PrismaService } from '@Services/prisma.service';
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
}
