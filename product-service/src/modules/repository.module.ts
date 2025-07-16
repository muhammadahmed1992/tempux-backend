import { Module } from "@nestjs/common";
import { BaseRepository } from "@Repository/base.repository";
import { BrandRepository } from "@Repository/brand.repository";
import { CategoryRepository } from "@Repository/category.repository";
import { ColorRepository } from "@Repository/color.repository";
import { SizeRepository } from "@Repository/size.repository";
import { TypesRepository } from "@Repository/types.repository";
@Module({
  imports: [],
  providers: [
    BaseRepository,
    BrandRepository,
    CategoryRepository,
    ColorRepository,
    SizeRepository,
    TypesRepository,
  ],
  exports: [
    BaseRepository,
    BrandRepository,
    CategoryRepository,
    ColorRepository,
    SizeRepository,
    TypesRepository,
  ],
})
export class RepositoryModule {}
