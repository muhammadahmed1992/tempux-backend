import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductAttributesService } from './product-attributes.service';
import { CreateProductAttributeCategoryMappingDto } from '@DTO/create-product-attribute-category-mapping.dto';
import { UserId } from '@Auth/decorators/userId.decorator';
import { HeaderAuthGuard } from '@Auth/guards/auth-user-guard';
import { 
  AttributeCategoryDto, 
  AttributeCategoryMappingsResponseDto 
} from '@Common/dto/attribute-category.dto';

@Controller('product-attributes')
export class ProductAttributesController {
  constructor(
    private readonly productAttributesService: ProductAttributesService,
  ) {}

  /**
   * Fetch all attribute categories
   * @returns List of all attribute categories with their IDs and metadata
   */
  @Get('categories')
  async getAllAttributeCategories() {
    return this.productAttributesService.getAllAttributeCategories();
  }

  /**
   * Fetch all attribute mappings for a specific category
   * @param categoryId The ID of the attribute category
   * @returns Attribute mappings for the specified category
   */
  @Get('categories/:categoryId/mappings')
  async getAttributeMappingsByCategory(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.productAttributesService.getAttributeMappingsByCategory(categoryId);
  }

  // Fetch attributes for a category
  @Get(':categoryId')
  async getAttributesByCategory(@Param('categoryId') categoryId: string) {
    return this.productAttributesService.getAttributesByCategory(
      Number(categoryId),
    );
  }

  // Insert new mapping
  @UseGuards(HeaderAuthGuard)
  @Post('mapping')
  async createAttributeCategoryMapping(
    @UserId() userId: bigint,
    @Body()
    data: CreateProductAttributeCategoryMappingDto,
  ) {
    return this.productAttributesService.createAttributeCategoryMapping(
      data,
      userId,
    );
  }
}
