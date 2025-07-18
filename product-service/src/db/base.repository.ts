// TODO: Optimization Required...

import { PrismaClient } from "@prisma/client";
export class BaseRepository<
  TModel extends { is_deleted: boolean },
  TCreateInput,
  TUpdateInput,
  TWhereUniqueInput,
  TWhereInput,
  TFindUniqueArgs extends {
    where: TWhereUniqueInput;
    select?: object | null;
    include?: object | null;
  },
  TFindManyArgs extends object,
  TFindFirstArgs extends object
> {
  protected readonly prismaClient: PrismaClient;

  constructor(
    prismaClient: PrismaClient,
    protected readonly model: {
      create: (args: {
        data: TCreateInput;
        select?: object;
      }) => Promise<TModel>;
      findUnique: (args: TFindUniqueArgs) => Promise<TModel | null>;
      findMany: (args: TFindManyArgs) => Promise<TModel[]>;
      update: (args: {
        where: TWhereUniqueInput;
        data: TUpdateInput;
        select?: object;
      }) => Promise<TModel>;
      delete: (args: {
        where: TWhereUniqueInput;
        select?: object;
      }) => Promise<TModel>;
      findFirst: (args: TFindFirstArgs) => Promise<TModel | null>;
      count: (args?: { where?: object }) => Promise<number>;
    }
  ) {
    this.prismaClient = prismaClient;
  }

  async create(data: TCreateInput, select?: object): Promise<TModel> {
    return this.model.create({ data, ...(select && { select }) });
  }

  async findUnique(args: TFindUniqueArgs): Promise<TModel | null> {
    const filteredWhere = this.applyIsDeletedFilter(args.where);
    return this.model.findUnique({ ...args, where: filteredWhere } as any);
  }

  async findMany(args: TFindManyArgs): Promise<TModel[]> {
    const filteredWhere = this.applyIsDeletedFilter((args as any).where);
    return this.model.findMany({ ...args, where: filteredWhere } as any);
  }

  async update(
    where: TWhereUniqueInput,
    data: TUpdateInput,
    select?: object
  ): Promise<TModel> {
    const filteredWhere = this.applyIsDeletedFilter(where);
    const args: {
      where: TWhereUniqueInput;
      data: TUpdateInput;
      select?: object;
    } = { where: filteredWhere as TWhereUniqueInput, data };
    if (select) {
      args.select = select;
    }
    return this.model.update(args);
  }

  async delete(where: TWhereUniqueInput, select?: object): Promise<TModel> {
    const filteredWhere = this.applyIsDeletedFilter(where);
    return this.model.update({
      where: filteredWhere as TWhereUniqueInput,
      data: { is_deleted: true } as any,
      ...(select && { select }),
    });
  }

  async findFirst(args: TFindFirstArgs): Promise<TModel | null> {
    const filteredWhere = this.applyIsDeletedFilter((args as any).where);
    return this.model.findFirst({ ...args, where: filteredWhere } as any);
  }

  async count(where?: object): Promise<number> {
    const filteredWhere = this.applyIsDeletedFilter(where);
    return this.model.count({ where: filteredWhere });
  }

  /**
   * Finds multiple records with pagination and filtering, and returns the total count
   * matching the filter in a single query.
   *
   * @param page - The current page number (1-based).
   * @param pageSize - The number of items per page.
   * @param where - Optional filter conditions.
   * @param select - Optional selection of fields to return for the records.
   * @param order - Optional sorting criteria.
   * @returns A Promise resolving to an object containing the paginated data and the total count.
   */
  async findManyPaginated(
    page: number,
    pageSize: number,
    where?: TWhereInput,
    select?: object,
    order?: object,
    include?: object
  ): Promise<{ data: TModel[]; totalCount: number }> {
    const filteredWhere = this.applyIsDeletedFilter(where as any);
    // if pagenumer is undefined then default page is 1
    if (!page) page = 1;
    if (!pageSize) pageSize = Number.MAX_VALUE;
    const skip = (page - 1) * pageSize;

    // Prisma's findMany can return both the data and the count in a single query
    // by using the _count aggregate.
    const [data, totalCount] = await this.prismaClient.$transaction([
      this.model.findMany({
        skip,
        take: pageSize,
        where: filteredWhere as any,
        select: select,
        orderBy: order as any,
        include: include,
      } as any),
      this.model.count({
        where: filteredWhere as any,
      }) as any,
    ]);

    return { data, totalCount };
  }

  /**
   * Helper to apply the default is_deleted: false filter.
   * If the user explicitly provides is_deleted in their filter, it overrides the default.
   */
  private applyIsDeletedFilter(userWhere: any): any {
    // If userWhere explicitly defines is_deleted, use that.
    // Otherwise, default to is_deleted: false.
    if (userWhere && typeof userWhere.is_deleted !== "undefined") {
      return userWhere;
    }
    return { ...userWhere, is_deleted: false };
  }
}
