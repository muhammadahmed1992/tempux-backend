import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, tags } from '@prisma/client';
import { BaseRepository } from '@Common/db/base.repository';
import { PrismaService } from '@Prisma/prisma.service';

@Injectable()
export class TagRepository extends BaseRepository<
  tags,
  Prisma.tagsCreateInput,
  Prisma.tagsUpdateInput,
  Prisma.tagsWhereUniqueInput,
  Prisma.tagsWhereInput,
  Prisma.tagsFindUniqueArgs,
  Prisma.tagsFindManyArgs,
  Prisma.tagsFindFirstArgs
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, prisma.tags);
  }
}
