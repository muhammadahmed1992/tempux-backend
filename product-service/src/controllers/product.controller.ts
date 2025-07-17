import { GetAllQueryDTO } from "@DTO/get-all-query.dto";
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ProductService } from "@Services/product.service";

@Controller("product")
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async getAll(@Query() query: GetAllQueryDTO) {
    const { page, pageSize, orderBy, where, select } = query;
    return this.productService.getAllPagedData(
      page,
      pageSize,
      orderBy,
      where,
      select
    );
  }
}
