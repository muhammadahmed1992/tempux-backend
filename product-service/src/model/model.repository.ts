import { Injectable } from '@nestjs/common';
import { Prisma, model } from '@prisma/client';
import { BaseRepository } from '@Common/db/base.repository';
import { PrismaService } from '@Prisma/prisma.service';

@Injectable()
export class ModelRepository extends BaseRepository<
  model,
  Prisma.modelCreateInput,
  Prisma.modelUpdateInput,
  Prisma.modelWhereUniqueInput,
  Prisma.modelWhereInput,
  Prisma.modelFindUniqueArgs,
  Prisma.modelFindManyArgs,
  Prisma.modelFindFirstArgs
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, prisma.model);
  }
}
