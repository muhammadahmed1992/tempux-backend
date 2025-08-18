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

  async getAlphabeticalData(): Promise<ApiResponse<Record<string, string[]>>> {
    const data = await this.repository.findMany({ select: { title: true } });
    if (!data || data?.length === 0) {
      throw new NotFoundException(Constants.NO_DATA_FOUND);
    }
    const grouped = Utils.groupAlphabetically(data, (item) => item.title);

    return ResponseHelper.CreateResponse<Record<string, string[]>>(
      Constants.DATA_SUCCESS,
      grouped,
      HttpStatus.OK,
    );
  }
}
