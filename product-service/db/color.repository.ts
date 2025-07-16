import { Injectable } from "@nestjs/common";
import { Prisma, color } from "@prisma/client";

import { BaseRepository } from "./base.repository";
import { PrismaService } from "@Services/prisma.service";

@Injectable()
export class ColorRepository extends BaseRepository<
  color,
  Prisma.color.CreateInput,
  Prisma.color.UpdateInput,
  Prisma.color.WhereUniqueInput,
  Prisma.color.WhereInput,
  Prisma.color.FindUniqueArgs,
  Prisma.color.FindManyArgs,
  Prisma.color.FindFirstArgs
> {
  constructor(private readonly prisma: PrismaService) {
    // NEW: Pass both the full prisma client AND the specific model
    super(prisma, prisma.color);
  }

  /**
   *
   * @param page this is the currently accessed page
   * @param pageSize the number of items returns by this query
   * @returns an array of color object inside the database.
   */
  async getAll(page: number, pageSize: number) {
    return this.findManyPaginated(
      page,
      pageSize,
      {
        is_deleted: false,
      },
      {
        id: true,
        title: true,
      },
      {
        order: "asc",
      }
    );
  }
}
