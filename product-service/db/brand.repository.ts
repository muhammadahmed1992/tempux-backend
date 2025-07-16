import { Injectable } from "@nestjs/common";
import { Prisma, brand } from "@prisma/client";

import { BaseRepository } from "./base.repository";
import { PrismaService } from "@Services/prisma.service";

@Injectable()
export class BrandRepository extends BaseRepository<
  brand,
  Prisma.brand.CreateInput,
  Prisma.brand.UpdateInput,
  Prisma.brand.WhereUniqueInput,
  Prisma.brand.WhereInput,
  Prisma.brand.FindUniqueArgs,
  Prisma.brand.FindManyArgs,
  Prisma.brand.FindFirstArgs
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, prisma.category);
  }

  /**
   *
   * @param page this is the currently accessed page
   * @param pageSize the number of items returns by this query
   * @returns an array of brand object inside the database.
   */
  async getAll(
    page: number,
    pageSize: number,
    orderBy: string,
    sortDirection: "asc" | "desc",
    where?: object,
    select?: object
  ) {
    return this.findManyPaginated(page, pageSize, {
      order: { [orderBy]: sortDirection },
      where,
      select,
    });
  }
}
