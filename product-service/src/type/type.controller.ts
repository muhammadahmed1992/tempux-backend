import { GetAllQueryDTO } from '@DTO/get-all-query.dto';
import { Controller, Get, Query } from '@nestjs/common';
import { TypeService } from './type.service';

@Controller('type')
export class TypeController {
  constructor(private readonly typeService: TypeService) {}

  @Get()
  async getAll(@Query() query: GetAllQueryDTO) {
    const { page, pageSize, orderBy, where, select } = query;
    return this.typeService.getAllPagedData(
      page,
      pageSize,
      orderBy,
      where,
      select,
    );
  }
}
