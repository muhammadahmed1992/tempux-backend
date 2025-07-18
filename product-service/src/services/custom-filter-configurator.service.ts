import { HttpStatus, Injectable } from "@nestjs/common";
import ApiResponse from "@Helper/api-response";
import ResponseHelper from "@Helper/response-helper";
import Constants from "@Helper/constants";
import { CustomFilterConfiguratorRepository } from "@Repository/custom-filter-configurator.repository";
@Injectable()
export class CustomFilterConfiguratorService {
  constructor(
    private readonly repository: CustomFilterConfiguratorRepository
  ) {}
  async getAllPagedData(
    pageNumber: number,
    pageSize: number,
    options?: {
      order?: object;
      where?: object;
      select?: object;
      include?: object;
    }
  ): Promise<ApiResponse<any[]>> {
    const { data, totalCount } = await this.repository.findManyPaginated(
      pageNumber,
      pageSize,
      options?.where,
      options?.select,
      options?.order,
      options?.include
    );
    return ResponseHelper.CreateResponse<any[]>(
      Constants.DATA_SUCCESS,
      data,
      HttpStatus.OK,
      {
        pageNumber,
        pageSize,
        totalCount,
        numberOfTotalPages: Math.ceil(totalCount / pageSize),
      }
    );
  }
}
