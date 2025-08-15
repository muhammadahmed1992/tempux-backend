import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, size } from '@prisma/client';

import { BaseRepository } from '@Common/db/base.repository';
import { PrismaService } from '@Prisma/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {
    super(prisma, prisma.size);
  }
}
