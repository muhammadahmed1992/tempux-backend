import { Injectable } from "@nestjs/common";
import { Prisma, size } from "@prisma/client";

import { BaseRepository } from "./base.repository";
import { PrismaService } from "@Services/prisma.service";

@Injectable()
export class SizeRepository extends BaseRepository<
  size,
  Prisma.size.CreateInput,
  Prisma.size.UpdateInput,
  Prisma.size.WhereUniqueInput,
  Prisma.size.WhereInput,
  Prisma.size.FindUniqueArgs,
  Prisma.size.FindManyArgs,
  Prisma.size.FindFirstArgs
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, prisma.category);
  }

  /**
   *
   * @param page this is the currently accessed page
   * @param pageSize the number of items returns by this query
   * @returns an array of size object inside the database.
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
