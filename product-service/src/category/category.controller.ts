import { GetAllQueryDTO } from '@DTO/get-all-query.dto';
import { Controller, Get, Query } from '@nestjs/common';
import { CategoryService } from './category.service';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async getAll(@Query() query: GetAllQueryDTO) {
    const { page, pageSize, orderBy, where, select } = query;
    return this.categoryService.getAllPagedData(
      page,
      pageSize,
      orderBy,
      where,
      select,
    );
  }

  @Get('custom')
  async getCustomAll(@Query() query: GetAllQueryDTO) {
    const { page, pageSize, orderBy, where, select } = query;
    return this.categoryService.getAllPagedData(
      page,
      pageSize,
      orderBy,
      where,
      select,
    );
  }

  @Get('alphabetical')
  async getAlphabeticalAll() {
    return await this.categoryService.getAlphabeticalData();
  }
}
