import { HttpStatus, Injectable } from "@nestjs/common";
import { BrandRepository } from "@Repository/brand.repository";
import { BaseService } from "./base.services";
import ApiResponse from "@Helper/api-response";
import { SetupListingDTO } from "@DTO/setup-listing.dto";
import ResponseHelper from "@Helper/response-helper";
import Constants from "@Helper/constants";
@Injectable()
export class BrandService extends BaseService<BrandRepository> {
  constructor(repository: BrandRepository) {
    super(repository);
  }
  async getAllPagedData(
    pageNumber: number,
    pageSize: number,
    orderBy: string,
    sortDirection: "asc" | "desc",
    where?: object,
    select?: object
  ): Promise<ApiResponse<SetupListingDTO[]>> {
    const [result, totalCount] = await super.getAll(
      pageNumber,
      pageSize,
      orderBy,
      sortDirection,
      where,
      select
    );
    return ResponseHelper.CreateResponse<SetupListingDTO[]>(
      Constants.DATA_SUCCESS,
      result,
      HttpStatus.OK,
      {
        pageNumber,
        pageSize,
        totalCount,
      }
    );
  }
}
