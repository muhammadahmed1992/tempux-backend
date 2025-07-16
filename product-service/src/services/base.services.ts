// src/prisma/prisma.service.ts
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "@Repository/base.repository";
@Injectable()
export class BaseService<TRepo extends BaseRepository<any>> {
  protected repository: TRepo;
  constructor(repository: TRepo) {
    this.repository = repository;
  }
  async getAll(
    pageNumber: number,
    pageSize: number,
    orderBy: string,
    sortDirection: "asc" | "desc",
    where?: object,
    select?: object
  ) {
    return this.repository.findManyPaginated(pageNumber, pageSize, {
      order: { [orderBy]: sortDirection },
      where,
      select,
    });
  }
}
