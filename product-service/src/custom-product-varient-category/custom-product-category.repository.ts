import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, CustomProductCategory } from '@prisma/client';
import { BaseRepository } from '@Common/db/base.repository';
import { PrismaService } from '@Prisma/prisma.service';

@Injectable()
export class CustomProductVariantCategoryRepository extends BaseRepository<
  CustomProductCategory,
  Prisma.CustomProductCategoryCreateInput,
  Prisma.CustomProductCategoryUpdateInput,
  Prisma.CustomProductCategoryWhereUniqueInput,
  Prisma.CustomProductCategoryWhereInput,
  Prisma.CustomProductCategoryFindUniqueArgs,
  Prisma.CustomProductCategoryFindManyArgs,
  Prisma.CustomProductCategoryFindFirstArgs
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, prisma.customProductCategory);
  }
}
