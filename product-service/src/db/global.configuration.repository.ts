import { Injectable } from '@nestjs/common';
import { Prisma, GlobalConfiguration } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { PrismaService } from '@Services/prisma.service';

@Injectable()
export class GlobalConfigurationRepository extends BaseRepository<
  GlobalConfiguration,
  Prisma.GlobalConfigurationCreateInput,
  Prisma.GlobalConfigurationUpdateInput,
  Prisma.GlobalConfigurationWhereUniqueInput,
  Prisma.GlobalConfigurationWhereInput,
  Prisma.GlobalConfigurationFindUniqueArgs,
  Prisma.GlobalConfigurationFindManyArgs,
  Prisma.GlobalConfigurationFindFirstArgs
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, prisma.globalConfiguration);
  }
}
