import { Injectable } from "@nestjs/common";
import { Prisma, PrismaClient, CustomProductCategory } from "@prisma/client";
import { BaseRepository } from "./base.repository";
import { PrismaService } from "@Services/prisma.service";

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
