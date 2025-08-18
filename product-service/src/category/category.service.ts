import { HttpStatus, Injectable } from '@nestjs/common';
import ApiResponse from '@Helper/api-response';
import { SetupListingDTO } from '@DTO/setup-listing.dto';
import ResponseHelper from '@Helper/response-helper';
import Constants from '@Helper/constants';
import { CategoryRepository } from './category.repository';
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
    // Get all data without pagination
    const { data } = await this.repository.findManyPaginated(
      1,
      Number.MAX_SAFE_INTEGER, // fetch all
    );

    // Group by first character
    const grouped: Record<string, string[]> = {};

    data.forEach((item: SetupListingDTO) => {
      if (!item.title) return;

      const firstChar = item.title.charAt(0).toUpperCase();
      if (!grouped[firstChar]) {
        grouped[firstChar] = [];
      }
      grouped[firstChar].push(item.title);
    });

    // Sort each group alphabetically
    const sortedGrouped: Record<string, string[]> = {};
    Object.keys(grouped)
      .sort((a, b) => a.localeCompare(b))
      .forEach((key) => {
        sortedGrouped[key] = grouped[key];
      });

    return ResponseHelper.CreateResponse<Record<string, string[]>>(
      Constants.DATA_SUCCESS,
      sortedGrouped,
      HttpStatus.OK,
    );
  }
}
