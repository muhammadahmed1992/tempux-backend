import { Injectable } from '@nestjs/common';
import { Prisma, type } from '@prisma/client';
import { BaseRepository } from '@Common/db/base.repository';
import { PrismaService } from '@Prisma/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {
    super(prisma, prisma.type);
  }
}
