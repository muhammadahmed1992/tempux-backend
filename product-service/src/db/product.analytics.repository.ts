import { Injectable } from '@nestjs/common';
import { Prisma, product_analytics } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { PrismaService } from '@Services/prisma.service';

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
}
