import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProductAttributesService } from './product-attributes.service';
import { CreateProductAttributeCategoryMappingDto } from '@DTO/create-product-attribute-category-mapping.dto';
import { UserId } from '@Auth/decorators/userId.decorator';
import { HeaderAuthGuard } from '@Auth/guards/auth-user-guard';
import {
  CreateProductDto,
} from '@DTO/create-product.dto';

@Controller('product-attributes')
export class ProductAttributesController {
  constructor(
    private readonly productAttributesService: ProductAttributesService,
  ) {}

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

  // product-attributes.controller.ts
  @UseGuards(HeaderAuthGuard)
  @Post('create')
  async create(
    @Body() dto: CreateProductDto,
    @Req() req: any,
    @UserId() userId: bigint,
  ) {
    // Assume user id is in req.user.id
    return this.productAttributesService.createProduct(dto, userId);
  }
}
