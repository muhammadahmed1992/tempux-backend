import { Injectable } from "@nestjs/common";
import { Prisma, PrismaClient, CustomProductCategory } from "@prisma/client";
import { BaseRepository } from "./base.repository";

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
  constructor(private readonly prisma: PrismaClient) {
    super(prisma, prisma.customProductCategory);
  }
}
