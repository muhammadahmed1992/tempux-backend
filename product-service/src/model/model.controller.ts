import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { ModelService } from './model.service';
import { GetAllQueryDTO } from '@Common/dto/get-all-query.dto';
import ResponseHelper from '@Common/helper/response-helper';
import ApiResponse from '@Common/helper/api-response';
import { UserId } from '@Auth/decorators/userId.decorator';

@Controller('models')
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

  @Get()
  async getAll(@Query() query: GetAllQueryDTO): Promise<ApiResponse<any[]>> {
    const { page, pageSize, orderBy, where, select } = query;

    const response = await this.modelService.getAllPagedData(
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

  @Get(':id')
  async getById(@Param('id') id: string): Promise<ApiResponse<any>> {
    const model = await this.modelService.findUnique({
      id: parseInt(id),
    });

    if (!model) {
      return ResponseHelper.CreateResponse<any>(
        'Model not found',
        null,
        HttpStatus.NOT_FOUND,
      );
    }

    return ResponseHelper.CreateResponse<any>('', model, HttpStatus.OK);
  }

  @Post()
  async create(
    @Body() data: any,
    @UserId() userId: bigint,
  ): Promise<ApiResponse<any>> {
    const model = await this.modelService.create(data, userId);

    return ResponseHelper.CreateResponse<any>(
      'Model created successfully',
      model,
      HttpStatus.CREATED,
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @UserId() userId: bigint,
  ): Promise<ApiResponse<any>> {
    const model = await this.modelService.update(
      { id: parseInt(id) },
      data,
      userId,
    );

    return ResponseHelper.CreateResponse<any>(
      'Model updated successfully',
      model,
      HttpStatus.OK,
    );
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @UserId() userId: bigint,
  ): Promise<ApiResponse<any>> {
    await this.modelService.delete({ id: parseInt(id) }, userId);

    return ResponseHelper.CreateResponse<any>(
      'Model deleted successfully',
      null,
      HttpStatus.OK,
    );
  }
}
