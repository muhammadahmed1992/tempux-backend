import { Injectable } from "@nestjs/common";
import { Prisma, PrismaClient, color } from "@prisma/client";
import { BaseRepository } from "./base.repository";
import { PrismaService } from "@Services/prisma.service";

@Injectable()
export class ColorRepository extends BaseRepository<
  color,
  Prisma.colorCreateInput,
  Prisma.colorUpdateInput,
  Prisma.colorWhereUniqueInput,
  Prisma.colorWhereInput,
  Prisma.colorFindUniqueArgs,
  Prisma.colorFindManyArgs,
  Prisma.colorFindFirstArgs
> {
  constructor(private readonly prisma: PrismaService) {
    // NEW: Pass both the full prisma client AND the specific model
    super(prisma, prisma.color);
  }
}
