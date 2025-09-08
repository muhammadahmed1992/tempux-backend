import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ModelRepository } from './model.repository';
import { Prisma } from '@prisma/client';
import ApiResponse from '@Helper/api-response';
import Utils from '@Common/utils';
import Constants from '@Helper/constants';
import ResponseHelper from '@Helper/response-helper';

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

  async getAlphabeticalData(): Promise<
    ApiResponse<Record<string, ItemSummary[]>>
  > {
    // Update select to include both id and title
    const data = await this.repository.findMany({
      select: {
        id: true, // Add id to the select
        title: true,
      },
    });

    if (!data || data?.length === 0) {
      throw new NotFoundException(Constants.NO_DATA_FOUND);
    }

    // Update the groupAlphabetically call to include idSelector
    const grouped = Utils.groupAlphabetically(
      data,
      (item) => item.title, // keySelector
      (item) => item.id, // idSelector
    );

    // Update the return type
    return ResponseHelper.CreateResponse<Record<string, ItemSummary[]>>(
      Constants.DATA_SUCCESS,
      grouped,
      HttpStatus.OK,
    );
  }
}
