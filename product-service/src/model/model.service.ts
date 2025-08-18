import { Injectable } from '@nestjs/common';
import { ModelRepository } from './model.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class ModelService {
  constructor(private readonly repository: ModelRepository) {}

  // TODO: Create DTOs.
  async create(data: Prisma.modelCreateInput, createdBy: bigint) {
    return this.repository.create({
      ...data,
      created_by: createdBy,
    });
  }

  async findUnique(where: Prisma.modelWhereUniqueInput) {
    return this.repository.findUnique({ where });
  }

  async findMany(args?: Prisma.modelFindManyArgs) {
    return this.repository.findMany(args || {});
  }

  async update(
    where: Prisma.modelWhereUniqueInput,
    data: Prisma.modelUpdateInput,
    updatedBy: bigint,
  ) {
    return this.repository.update(where, {
      ...data,
      updated_by: updatedBy,
    });
  }

  async delete(where: Prisma.modelWhereUniqueInput, deletedBy: bigint) {
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
