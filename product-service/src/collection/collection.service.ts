import { Injectable } from '@nestjs/common';
import { CollectionRepository } from './collection.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class CollectionService {
  constructor(private readonly repository: CollectionRepository) {}

  async create(data: Prisma.collectionCreateInput, createdBy: bigint) {
    return this.repository.create({
      ...data,
      created_by: createdBy,
    });
  }

  async findUnique(where: Prisma.collectionWhereUniqueInput) {
    return this.repository.findUnique({ where });
  }

  async findMany(args?: Prisma.collectionFindManyArgs) {
    return this.repository.findMany(args || {});
  }

  async update(
    where: Prisma.collectionWhereUniqueInput,
    data: Prisma.collectionUpdateInput,
    updatedBy: bigint,
  ) {
    return this.repository.update(where, {
      ...data,
      updated_by: updatedBy,
    });
  }

  async delete(where: Prisma.collectionWhereUniqueInput, deletedBy: bigint) {
    return this.repository.update(where, {
      deleted_by: deletedBy,
      deleted_at: new Date(),
      is_deleted: true,
    });
  }

  async getAllPagedData(
    page: number,
    pageSize: number,
    orderBy?: object,
    where?: object,
    select?: object,
  ) {
    return this.repository.findManyPaginated(
      page,
      pageSize,
      where,
      select,
      orderBy,
    );
  }
}
