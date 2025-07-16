import { GetAllQueryDTO } from "@DTO/get-all-query.dto";
import { Controller, Get, Query } from "@nestjs/common";
import { ColorService } from "@Services/color.service";

@Controller("color")
export class ColorController {
  constructor(private readonly colorService: ColorService) {}

  @Get()
  async getAll(@Query() query: GetAllQueryDTO) {
    const { page, pageSize, orderBy, where, select } = query;
    return this.colorService.getAllPagedData(
      page,
      pageSize,
      orderBy,
      where,
      select
    );
  }
}
