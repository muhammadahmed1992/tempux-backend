import { Injectable } from '@nestjs/common';
import { Prisma, collection } from '@prisma/client';
import { BaseRepository } from '@Common/db/base.repository';
import { PrismaService } from '@Prisma/prisma.service';

@Injectable()
export class CollectionRepository extends BaseRepository<
  collection,
  Prisma.collectionCreateInput,
  Prisma.collectionUpdateInput,
  Prisma.collectionWhereUniqueInput,
  Prisma.collectionWhereInput,
  Prisma.collectionFindUniqueArgs,
  Prisma.collectionFindManyArgs,
  Prisma.collectionFindFirstArgs
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, prisma.collection);
  }
}
