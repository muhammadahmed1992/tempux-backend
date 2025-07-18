import { Module } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { BaseRepository } from "@Repository/base.repository";
import { BrandRepository } from "@Repository/brand.repository";
import { CategoryRepository } from "@Repository/category.repository";
import { ColorRepository } from "@Repository/color.repository";
import { CustomFilterConfiguratorRepository } from "@Repository/custom-filter-configurator.repository";
import { CustomProductVariantCategoryRepository } from "@Repository/custom-product-category.repository";
import { ProductVariantRepository } from "@Repository/product-variant.repository";
import { ProductRepository } from "@Repository/product.repository";
import { SizeRepository } from "@Repository/size.repository";
import { TypeRepository } from "@Repository/types.repository";
@Module({
  imports: [],
  providers: [
    PrismaClient,
    BaseRepository,
    BrandRepository,
    CategoryRepository,
    ColorRepository,
    SizeRepository,
    TypeRepository,
    ProductRepository,
    ProductVariantRepository,
    CustomFilterConfiguratorRepository,
    CustomProductVariantCategoryRepository,
  ],
  exports: [
    BaseRepository,
    BrandRepository,
    CategoryRepository,
    ColorRepository,
    SizeRepository,
    TypeRepository,
    ProductRepository,
    ProductVariantRepository,
    CustomFilterConfiguratorRepository,
    CustomProductVariantCategoryRepository,
  ],
})
export class RepositoryModule {}
