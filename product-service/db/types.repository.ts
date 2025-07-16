import { Injectable } from "@nestjs/common";
import { Prisma, type } from "@prisma/client";

import { BaseRepository } from "./base.repository";
import { PrismaService } from "@Services/prisma.service";

@Injectable()
export class TypeRepository extends BaseRepository<
  type,
  Prisma.type.CreateInput,
  Prisma.type.UpdateInput,
  Prisma.type.WhereUniqueInput,
  Prisma.type.WhereInput,
  Prisma.type.FindUniqueArgs,
  Prisma.type.FindManyArgs,
  Prisma.type.FindFirstArgs
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, prisma.type);
  }

  /**
   *
   * @param page this is the currently accessed page
   * @param pageSize the number of items returns by this query
   * @returns an array of type object inside the database.
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
