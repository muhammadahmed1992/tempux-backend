import { Injectable } from "@nestjs/common";
import { Prisma, PrismaClient, CustomFilterConfigurator } from "@prisma/client";
import { BaseRepository } from "./base.repository";

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
  constructor(private readonly prisma: PrismaClient) {
    super(prisma, prisma.customFilterConfigurator);
  }
}
