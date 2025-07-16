import { Injectable } from "@nestjs/common";
import { Prisma, PrismaClient, size } from "@prisma/client";

import { BaseRepository } from "./base.repository";

@Injectable()
export class SizeRepository extends BaseRepository<
  size,
  Prisma.sizeCreateInput,
  Prisma.sizeUpdateInput,
  Prisma.sizeWhereUniqueInput,
  Prisma.sizeWhereInput,
  Prisma.sizeFindUniqueArgs,
  Prisma.sizeFindManyArgs,
  Prisma.sizeFindFirstArgs
> {
  constructor(private readonly prisma: PrismaClient) {
    super(prisma, prisma.size);
  }
}
