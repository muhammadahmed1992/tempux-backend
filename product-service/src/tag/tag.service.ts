import { HttpStatus, Injectable } from '@nestjs/common';
import { TagRepository } from './tag.repository';
import ApiResponse from '@Helper/api-response';
import { SetupListingDTO } from '@DTO/setup-listing.dto';
import ResponseHelper from '@Helper/response-helper';
import Constants from '@Helper/constants';
@Injectable()
export class TagService {
  constructor(private readonly repository: TagRepository) {}
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
      data.map((tag) => ({
        title: tag.title,
        id: tag.id,
        description: tag.description,
        created_at: tag.created_at,
        updated_at: tag.updated_at,
      })),
      HttpStatus.OK,
      {
        pageNumber,
        pageSize,
        totalCount,
        numberOfTotalPages: Math.ceil(totalCount / pageSize),
      },
    );
  }
}
