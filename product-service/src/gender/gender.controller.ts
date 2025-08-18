import { Controller, Get, Query } from '@nestjs/common';
import { GenderService } from './gender.service';
import { GetAllQueryDTO } from '../common/dto/get-all-query.dto';
import ResponseHelper from '../common/helper/response-helper';
import ApiResponse from '../common/helper/api-response';
import { HttpStatus } from '@nestjs/common';

@Controller('genders')
export class GenderController {
  constructor(private readonly genderService: GenderService) {}

  @Get()
  async getAll(@Query() query: GetAllQueryDTO): Promise<ApiResponse<any[]>> {
    const { page, pageSize, orderBy, where, select } = query;

    const response = await this.genderService.getAllPagedData(
      page,
      pageSize,
      orderBy,
      where,
      select,
    );

    return ResponseHelper.CreateResponse<any[]>(
      '',
      response.data,
      HttpStatus.OK,
      {
        totalCount: response.totalCount,
        pageNumber: page,
        pageSize: pageSize,
        numberOfTotalPages: Math.ceil(response.totalCount / pageSize),
      },
    );
  }
}
