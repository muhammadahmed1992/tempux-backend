import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import ApiResponse from '@Helper/api-response';
import { SetupListingDTO } from '@DTO/setup-listing.dto';
import ResponseHelper from '@Helper/response-helper';
import Constants from '@Helper/constants';
import { CategoryRepository } from './category.repository';
import Utils from '@Common/utils';
@Injectable()
export class CategoryService {
  constructor(private readonly repository: CategoryRepository) {}
  async getAllPagedData(
    pageNumber: number,
    pageSize: number,
    order?: object,
    where?: object,
    select?: object,
  ): Promise<ApiResponse<SetupListingDTO[]>> {
    const { data, totalCount } = await this.repository.findManyPaginated(
      pageNumber,
      pageSize,
      where,
      select,
      order,
    );
    return ResponseHelper.CreateResponse<SetupListingDTO[]>(
      Constants.DATA_SUCCESS,
      data,
      HttpStatus.OK,
      {
        pageNumber,
        pageSize,
        totalCount,
        numberOfTotalPages: Math.ceil(totalCount / pageSize),
      },
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
