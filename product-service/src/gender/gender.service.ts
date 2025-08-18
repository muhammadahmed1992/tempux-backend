import { Injectable } from '@nestjs/common';
import { GenderRepository } from './gender.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class GenderService {
  constructor(private readonly repository: GenderRepository) {}

  async create(data: Prisma.genderCreateInput, createdBy: bigint) {
    return this.repository.create({
      ...data,
      created_by: createdBy,
    });
  }

  async findUnique(where: Prisma.genderWhereUniqueInput) {
    return this.repository.findUnique({ where });
  }

  async findMany(args?: Prisma.genderFindManyArgs) {
    return this.repository.findMany(args || {});
  }

  async update(
    where: Prisma.genderWhereUniqueInput,
    data: Prisma.genderUpdateInput,
    updatedBy: bigint,
  ) {
    return this.repository.update(where, {
      ...data,
      updated_by: updatedBy,
    });
  }

  async delete(where: Prisma.genderWhereUniqueInput, deletedBy: bigint) {
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
