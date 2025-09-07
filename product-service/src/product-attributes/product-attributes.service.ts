import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import ResponseHelper from '@Helper/response-helper';
import { CreateProductAttributeCategoryMappingDto } from '@DTO/create-product-attribute-category-mapping.dto';
@Injectable()
export class ProductAttributesService {
  constructor(private prisma: PrismaService) {}

  // Get attributes by category
  async getAttributesByCategory(categoryId: number) {
    try {
      const attributes =
        await this.prisma.productAttributeCategories.findUnique({
          where: { id: categoryId },
          select: {
            id: true,
            name: true,
            attributeMappings: {
              where: {
                attribute: { is_active: true },
              },
              select: {
                data_type: true,
                is_mandatory: true,
                attribute: {
                  select: {
                    id: true,
                    name: true,
                    display_name: true,
                    unit: true,
                  },
                },
              },
            },
          },
        });
      if (!attributes) {
        throw new NotFoundException(`Category with ID ${categoryId} not found`);
      }
      const flattenedAttributes = attributes.attributeMappings.map((m) => ({
        category_id: attributes.id,
        category_name: attributes.name,
        attribute_id: m.attribute.id,
        attribute_name: m.attribute.name,
        display_name: m.attribute.display_name,
        unit: m.attribute.unit,
        is_mandatory: m.is_mandatory,
        data_type: m.data_type,
      }));
      return ResponseHelper.CreateResponse(
        'Success',
        flattenedAttributes,
        HttpStatus.OK,
      );
    } catch (error) {
      console.error('Error fetching attributes by category:', error);
      return ResponseHelper.CreateResponse(
        'Failed to fetch attributes',
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Create attribute-category mapping
  async createAttributeCategoryMapping(
    data: CreateProductAttributeCategoryMappingDto,
    userId: bigint,
  ) {
    try {
      // Check if mapping already exists
      const existingMapping =
        await this.prisma.attributeCategoryMapping.findUnique({
          where: {
            attribute_category_id_attribute_id: {
              attribute_category_id: data.attribute_category_id,
              attribute_id: data.attribute_id,
            },
          },
        });

      if (existingMapping) {
        throw new ConflictException(
          'Mapping already exists for the given attribute and category IDs',
        );
      }

      const createdMapping = await this.prisma.attributeCategoryMapping.create({
        data: {
          attribute_category_id: Number(data.attribute_category_id),
          attribute_id: Number(data.attribute_id),
          data_type: data.data_type,
          is_mandatory: data.is_mandatory ?? false,
          created_by: userId,
        },
      });

      return ResponseHelper.CreateResponse(
        'Success',
        {
          id: createdMapping.id,
          attribute_category_id: createdMapping.attribute_category_id,
          attribute_id: createdMapping.attribute_id,
          data_type: createdMapping.data_type,
          is_mandatory: createdMapping.is_mandatory,
        },
        HttpStatus.CREATED,
      );
    } catch (error) {
      console.error('Error creating attribute-category mapping:', error);
      return ResponseHelper.CreateResponse(
        'Failed to create mapping',
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
