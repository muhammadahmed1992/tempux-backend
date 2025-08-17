import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { CollectionService } from './collection.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetAllQueryDTO } from '../common/dto/get-all-query.dto';
import ResponseHelper from '../common/helper/response-helper';
import ApiResponse from '../common/helper/api-response';
import { UserId } from '../auth/decorators/userId.decorator';

@Controller('collections')
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Get()
  async getAll(@Query() query: GetAllQueryDTO): Promise<ApiResponse<any[]>> {
    const { page, pageSize, orderBy, where, select } = query;

    const response = await this.collectionService.getAllPagedData(
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
      response.getMeta(),
    );
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<ApiResponse<any>> {
    const collection = await this.collectionService.findUnique({
      id: parseInt(id),
    });

    if (!collection) {
      return ResponseHelper.CreateResponse<any>(
        'Collection not found',
        null,
        HttpStatus.NOT_FOUND,
      );
    }

    return ResponseHelper.CreateResponse<any>('', collection, HttpStatus.OK);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() data: any,
    @UserId() userId: bigint,
  ): Promise<ApiResponse<any>> {
    const collection = await this.collectionService.create(data, userId);

    return ResponseHelper.CreateResponse<any>(
      'Collection created successfully',
      collection,
      HttpStatus.CREATED,
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @UserId() userId: bigint,
  ): Promise<ApiResponse<any>> {
    const collection = await this.collectionService.update(
      { id: parseInt(id) },
      data,
      userId,
    );

    return ResponseHelper.CreateResponse<any>(
      'Collection updated successfully',
      collection,
      HttpStatus.OK,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(
    @Param('id') id: string,
    @UserId() userId: bigint,
  ): Promise<ApiResponse<any>> {
    await this.collectionService.delete({ id: parseInt(id) }, userId);

    return ResponseHelper.CreateResponse<any>(
      'Collection deleted successfully',
      null,
      HttpStatus.OK,
    );
  }
}
