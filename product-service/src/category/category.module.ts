import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CategoryRepository } from './category.repository';
import { CustomFilterConfigurationModule } from '@CustomFilterConfigurator/custom-filter-configurator.module';

@Module({
  imports: [CustomFilterConfigurationModule],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository],
})
export class CategoryModule {}
