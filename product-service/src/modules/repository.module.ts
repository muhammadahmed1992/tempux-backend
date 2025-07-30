import { Module } from '@nestjs/common';
import { BaseRepository } from '@Repository/base.repository';
import { BrandRepository } from '@Repository/brand.repository';
import { CartRepository } from '@Repository/cart.repository';
import { CategoryRepository } from '@Repository/category.repository';
import { ColorRepository } from '@Repository/color.repository';
import { CustomFilterConfiguratorRepository } from '@Repository/custom-filter-configurator.repository';
import { CustomProductVariantCategoryRepository } from '@Repository/custom-product-category.repository';
import { FavoriteRepository } from '@Repository/favorite.repository';
import { GlobalConfigurationRepository } from '@Repository/global.configuration.repository';
import { ProductVariantRepository } from '@Repository/product-variant.repository';
import { ProductRepository } from '@Repository/product.repository';
import { SizeRepository } from '@Repository/size.repository';
import { TypeRepository } from '@Repository/types.repository';
import { PrismaService } from '@Services/prisma.service';
@Module({
  imports: [],
  providers: [
    PrismaService,
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
    FavoriteRepository,
    CartRepository,
    GlobalConfigurationRepository,
  ],
  exports: [
    PrismaService,
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
    FavoriteRepository,
    CartRepository,
    GlobalConfigurationRepository,
  ],
})
export class RepositoryModule {}
