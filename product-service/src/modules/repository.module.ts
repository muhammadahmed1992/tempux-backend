import { Module } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { BaseRepository } from "@Repository/base.repository";
import { BrandRepository } from "@Repository/brand.repository";
import { CategoryRepository } from "@Repository/category.repository";
import { ColorRepository } from "@Repository/color.repository";
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
  ],
  exports: [
    BaseRepository,
    BrandRepository,
    CategoryRepository,
    ColorRepository,
    SizeRepository,
    TypeRepository,
  ],
})
export class RepositoryModule {}
