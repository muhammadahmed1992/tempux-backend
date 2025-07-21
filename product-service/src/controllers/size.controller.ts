import { GetAllQueryDTO } from "@DTO/get-all-query.dto";
import { Controller, Get, Query } from "@nestjs/common";
import { SizeService } from "@Services/size.service";

@Controller("size")
export class SizeController {
  constructor(private readonly categoryService: SizeService) {}

  @Get()
  async getAll(@Query() query: GetAllQueryDTO) {
    const { page, pageSize, orderBy, where, select } = query;
    return this.categoryService.getAllPagedData(
      page,
      pageSize,
      orderBy,
      where,
      select
    );
  }
}
