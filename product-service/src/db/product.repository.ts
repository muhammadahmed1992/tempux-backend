import { Injectable } from "@nestjs/common";
import { Prisma, PrismaClient, product } from "@prisma/client";
import { BaseRepository } from "./base.repository";
import { PrismaService } from "@Services/prisma.service";

@Injectable()
export class ProductRepository extends BaseRepository<
  product,
  Prisma.productCreateInput,
  Prisma.productUpdateInput,
  Prisma.productWhereUniqueInput,
  Prisma.productWhereInput,
  Prisma.productFindUniqueArgs,
  Prisma.productFindManyArgs,
  Prisma.productFindFirstArgs
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, prisma.product);
  }
}
