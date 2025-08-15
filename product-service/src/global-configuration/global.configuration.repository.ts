import { Injectable } from '@nestjs/common';
import { Prisma, GlobalConfiguration } from '@prisma/client';
import { BaseRepository } from '@Common/db/base.repository';
import { PrismaService } from '@Prisma/prisma.service';

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
