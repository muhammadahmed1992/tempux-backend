import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { PrismaModule } from '@Prisma/prisma.module';
import { BrandRepository } from '@Brand/brand.repository';
import { ModelRepository } from '../model/model.repository';
import { CategoryRepository } from '@Category/category.repository';

@Module({
  imports: [PrismaModule],
  controllers: [SearchController],
  providers: [
    SearchService,
    BrandRepository,
    ModelRepository,
    CategoryRepository,
  ],
  exports: [SearchService],
})
export class SearchModule {}
