import { JwtAuthGuard } from "@Auth/jwt-auth.guard";
import { GetAllQueryDTO } from "@DTO/get-all-query.dto";
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { BrandService } from "@Services/brand.service";

@Controller("brand")
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAll(@Query() query: GetAllQueryDTO) {
    const { page, pageSize, orderBy, where, select } = query;
    return this.brandService.getAllPagedData(
      page,
      pageSize,
      orderBy,
      where,
      select
    );
  }
}
