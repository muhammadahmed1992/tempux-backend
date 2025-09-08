import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import ResponseHelper from '@Helper/response-helper';
import { CreateProductAttributeCategoryMappingDto } from '@DTO/create-product-attribute-category-mapping.dto';
import { CreateProductDto } from '@DTO/create-product.dto';
import { Prisma } from '@prisma/client';
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
        attribute_id: m.attribute.id,
        attribute_name: m.attribute.name,
        display_name: m.attribute.display_name,
        unit: m.attribute.unit,
        is_mandatory: m.is_mandatory,
        data_type: m.data_type,
      }));
      return ResponseHelper.CreateResponse(
        'Success',
        {
          category_id: attributes.id,
          category_name: attributes.name,
          categoryAttributes: flattenedAttributes,
        },
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
  async createProduct(dto: CreateProductDto, userId: bigint) {
    try {
      return this.prisma.$transaction(async (tx) => {
        // 1. Create product
        const newProduct = await tx.product.create({
          data: {
            title: dto.product.title,
            description: dto.product.description,
            name: dto.product.title, // Using title as name
            product_slug: dto.product.slug,
            // year_of_production: dto.product.year_of_production,
            // referenceNumber: dto.product.referenceNumber,
            // category_id: dto.categoryId,
            created_by: userId,
          },
        });

        // 2. Fetch all mappings for this category
        const mappings = await tx.attributeCategoryMapping.findMany({
          where: { attribute_category_id: dto.categoryId, is_active: true },
        });

        if (!mappings.length) {
          throw new BadRequestException(
            'No attribute mappings found for this category',
          );
        }

        // 3. Check mandatory attributes
        const mandatoryMappings = mappings.filter((m) => m.is_mandatory);
        for (const mm of mandatoryMappings) {
          const exists = dto.attributeValues.some(
            (av) => av.attributeId === mm.attribute_id,
          );
          if (!exists) {
            throw new BadRequestException(
              `Mandatory attribute ${mm.attribute_id} is missing for category ${dto.categoryId}`,
            );
          }
        }

        // 4. Process each attribute value
        for (const attr of dto.attributeValues) {
          const mapping = mappings.find(
            (m) => m.attribute_id === attr.attributeId,
          );
          if (!mapping) {
            throw new BadRequestException(
              `Attribute ${attr.attributeId} is not valid for category ${dto.categoryId}`,
            );
          }

          let stringVal: string | null = null;
          let numberVal: Prisma.Decimal | null = null;
          let boolVal: boolean | null = null;
          let dateVal: Date | null = null;

          switch (attr.dataType) {
            case 'string':
              stringVal = String(attr.value);
              break;
            case 'number':
              numberVal = new Prisma.Decimal(attr.value);
              break;
            case 'boolean':
              boolVal = Boolean(attr.value);
              break;
            case 'date':
              dateVal = new Date(attr.value);
              break;
            default:
              throw new BadRequestException(
                `Unsupported data type: ${attr.dataType}`,
              );
          }

          await tx.productAttributeValueMapping.create({
            data: {
              attribute_category_mapping_id: mapping.id,
              product_id: newProduct.id,
              string_value: stringVal,
              number_value: numberVal,
              boolean_value: boolVal,
              date_value: dateVal,
              created_by: userId,
            },
          });
        }

        return ResponseHelper.CreateResponse(
          'Product created successfully',
          newProduct,
          HttpStatus.CREATED,
        );
      });
    } catch (error) {
      console.error('Error creating product with attributes:', error);
      return ResponseHelper.CreateResponse(
        'Failed to create product',
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
