import { Injectable } from "@nestjs/common";
import { Prisma, PrismaClient, brand } from "@prisma/client";
import { BaseRepository } from "./base.repository";
import { PrismaService } from "@Services/prisma.service";

@Injectable()
export class BrandRepository extends BaseRepository<
  brand,
  Prisma.brandCreateInput,
  Prisma.brandUpdateInput,
  Prisma.brandWhereUniqueInput,
  Prisma.brandWhereInput,
  Prisma.brandFindUniqueArgs,
  Prisma.brandFindManyArgs,
  Prisma.brandFindFirstArgs
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, prisma.brand);
  }
}
