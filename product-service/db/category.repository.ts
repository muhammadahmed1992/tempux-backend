import { Injectable } from "@nestjs/common";
import { Prisma, category } from "@prisma/client";

import { BaseRepository } from "./base.repository";
import { PrismaService } from "@Services/prisma.service";

@Injectable()
export class CategoryRepository extends BaseRepository<
  category,
  Prisma.category.CreateInput,
  Prisma.category.UpdateInput,
  Prisma.category.WhereUniqueInput,
  Prisma.category.WhereInput,
  Prisma.category.FindUniqueArgs,
  Prisma.category.FindManyArgs,
  Prisma.category.FindFirstArgs
> {
  constructor(private readonly prisma: PrismaService) {
    // NEW: Pass both the full prisma client AND the specific model
    super(prisma, prisma.category);
  }

  /**
   *
   * @param page this is the currently accessed page
   * @param pageSize the number of items returns by this query
   * @returns an array of category object inside the database.
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
