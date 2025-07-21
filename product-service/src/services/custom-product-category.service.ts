import { Injectable } from "@nestjs/common";
import { CustomProductVariantCategoryRepository } from "@Repository/custom-product-category.repository";
@Injectable()
export class CustomProductVariantCategoryService {
  constructor(
    private readonly repository: CustomProductVariantCategoryRepository
  ) {}

  async findMany(where: object, select: object) {
    return this.repository.findMany({
      where,
      select,
    });
  }
}
