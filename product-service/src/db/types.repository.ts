import { Injectable } from "@nestjs/common";
import { Prisma, PrismaClient, type } from "@prisma/client";

import { BaseRepository } from "./base.repository";

@Injectable()
export class TypeRepository extends BaseRepository<
  type,
  Prisma.typeCreateInput,
  Prisma.typeUpdateInput,
  Prisma.typeWhereUniqueInput,
  Prisma.typeWhereInput,
  Prisma.typeFindUniqueArgs,
  Prisma.typeFindManyArgs,
  Prisma.typeFindFirstArgs
> {
  constructor(private readonly prisma: PrismaClient) {
    super(prisma, prisma.type);
  }
}
