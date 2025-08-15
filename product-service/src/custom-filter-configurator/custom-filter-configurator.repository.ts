import { Injectable } from '@nestjs/common';
import { Prisma, CustomFilterConfigurator } from '@prisma/client';
import { BaseRepository } from '@Common/db/base.repository';
import { PrismaService } from '@Prisma/prisma.service';

@Injectable()
export class CustomFilterConfiguratorRepository extends BaseRepository<
  CustomFilterConfigurator,
  Prisma.CustomFilterConfiguratorCreateInput,
  Prisma.CustomFilterConfiguratorUpdateInput,
  Prisma.CustomFilterConfiguratorWhereUniqueInput,
  Prisma.CustomFilterConfiguratorWhereInput,
  Prisma.CustomFilterConfiguratorFindUniqueArgs,
  Prisma.CustomFilterConfiguratorFindManyArgs,
  Prisma.CustomFilterConfiguratorFindFirstArgs
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, prisma.customFilterConfigurator);
  }
}
