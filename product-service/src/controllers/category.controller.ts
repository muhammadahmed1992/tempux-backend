import { GetAllQueryDTO } from '@DTO/get-all-query.dto';
import { Controller, Get, Query } from '@nestjs/common';
import { CategoryService } from '@Services/category.service';
import { CustomFilterConfiguratorService } from '@Services/custom-filter-configurator.service';

@Controller('category')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly customFiltersCategories: CustomFilterConfiguratorService,
  ) {}

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
    return this.customFiltersCategories.getAllPagedData(
      page,
      pageSize,
      orderBy,
      where,
      select,
    );
  }
}
