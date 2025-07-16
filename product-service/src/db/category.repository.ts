import { Injectable } from "@nestjs/common";
import { Prisma, PrismaClient, category } from "@prisma/client";

import { BaseRepository } from "./base.repository";

@Injectable()
export class CategoryRepository extends BaseRepository<
  category,
  Prisma.categoryCreateInput,
  Prisma.categoryUpdateInput,
  Prisma.categoryWhereUniqueInput,
  Prisma.categoryWhereInput,
  Prisma.categoryFindUniqueArgs,
  Prisma.categoryFindManyArgs,
  Prisma.categoryFindFirstArgs
> {
  constructor(private readonly prisma: PrismaClient) {
    super(prisma, prisma.category);
  }
}
