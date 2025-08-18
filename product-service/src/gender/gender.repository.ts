import { Injectable } from '@nestjs/common';
import { Prisma, gender } from '@prisma/client';
import { BaseRepository } from '@Common/db/base.repository';
import { PrismaService } from '@Prisma/prisma.service';

@Injectable()
export class GenderRepository extends BaseRepository<
  gender,
  Prisma.genderCreateInput,
  Prisma.genderUpdateInput,
  Prisma.genderWhereUniqueInput,
  Prisma.genderWhereInput,
  Prisma.genderFindUniqueArgs,
  Prisma.genderFindManyArgs,
  Prisma.genderFindFirstArgs
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, prisma.gender);
  }
}
