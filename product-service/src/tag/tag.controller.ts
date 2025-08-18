import { GetAllQueryDTO } from '@DTO/get-all-query.dto';
import { Controller, Get, Query } from '@nestjs/common';
import { TagService } from './tag.service';

@Controller('tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  async getAll(@Query() query: GetAllQueryDTO) {
    const { page, pageSize, orderBy, where, select } = query;
    return this.tagService.getAllPagedData(
      page,
      pageSize,
      orderBy,
      where,
      select,
    );
  }
}
