import { PrismaClient, Prisma } from "@prisma/client";

export abstract class BaseRepository<TModel> {
  protected prisma: PrismaClient;
  protected model: any; // the specific Prisma model

  constructor(prisma: PrismaClient, model: any) {
    this.prisma = prisma;
    this.model = model;
  }

  async create(data: Prisma.PrismaClientKnownRequestError): Promise<TModel> {
    return this.model.create({ data });
  }

  async findUnique(
    where: Prisma.PrismaClientKnownRequestError
  ): Promise<TModel | null> {
    return this.model.findUnique({ where });
  }

  async findMany(where = {}): Promise<TModel[]> {
    return this.model.findMany({ where });
  }

  async update(where: any, data: any): Promise<TModel> {
    return this.model.update({ where, data });
  }

  async delete(where: any): Promise<TModel> {
    return this.model.delete({ where });
  }
}
