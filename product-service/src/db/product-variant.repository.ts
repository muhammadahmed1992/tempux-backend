import { Injectable } from "@nestjs/common";
import { Prisma, PrismaClient, product_variants } from "@prisma/client";
import { BaseRepository } from "./base.repository";
import { PrismaService } from "@Services/prisma.service";

@Injectable()
export class ProductVariantRepository extends BaseRepository<
  product_variants,
  Prisma.product_variantsCreateInput,
  Prisma.product_variantsUpdateInput,
  Prisma.product_variantsWhereUniqueInput,
  Prisma.product_variantsWhereInput,
  Prisma.product_variantsFindUniqueArgs,
  Prisma.product_variantsFindManyArgs,
  Prisma.product_variantsFindFirstArgs
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, prisma.product_variants);
  }
}
