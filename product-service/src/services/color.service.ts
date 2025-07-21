import { HttpStatus, Injectable } from "@nestjs/common";
import ApiResponse from "@Helper/api-response";
import { SetupListingDTO } from "@DTO/setup-listing.dto";
import ResponseHelper from "@Helper/response-helper";
import Constants from "@Helper/constants";
import { ColorRepository } from "@Repository/color.repository";
@Injectable()
export class ColorService {
  constructor(private readonly repository: ColorRepository) {}
  async getAllPagedData(
    pageNumber: number,
    pageSize: number,
    order?: object,
    where?: object,
    select?: object
  ): Promise<ApiResponse<SetupListingDTO[]>> {
    const { data, totalCount } = await this.repository.findManyPaginated(
      pageNumber,
      pageSize,
      where,
      select,
      order
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
