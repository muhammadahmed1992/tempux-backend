import { GetAllQueryDTO } from '@DTO/get-all-query.dto';
import { Controller, Get, Query } from '@nestjs/common';
import { BrandService } from '@Services/brand.service';

@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Get()
  async getAll(@Query() query: GetAllQueryDTO) {
    const { page, pageSize, orderBy, where, select } = query;
    return this.brandService.getAllPagedData(
      page,
      pageSize,
      orderBy,
      where,
      select,
    );
  }
}
