import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@Prisma/prisma.service';
import ResponseHelper from '@Helper/response-helper';
import { CreateProductAttributeCategoryMappingDto } from '@DTO/create-product-attribute-category-mapping.dto';
import { ProductValidationService } from '@Product/product-validation.service';
import { Prisma } from '@prisma/client';
import { ValidationError } from 'class-validator';
import { AttributeDto } from '@DTO/product.dto';
@Injectable()
export class ProductAttributesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productValidationService: ProductValidationService,
  ) {}

  // Get attributes by category
  async getAttributesByCategory(categoryId: number) {
    try {
      const attributes = await this.prisma.attribute_categories.findUnique({
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

  /*
   * Update product attributes
   */
  async updateProductAttributes(
    tx: Prisma.TransactionClient,
    productId: bigint,
    attributeUpdates: AttributeDto[],
    userId: bigint,
  ) {
    try {
      // Get product category for validation
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { category_id: true },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      if (!product.category_id) {
        throw new BadRequestException('Product category is required');
      }

      // Arrays to collect exceptions and successful updates
      const missingAttributeExceptions: string[] = [];
      const validationErrors: string[] = [];
      const successfulUpdates: any[] = [];

      // Process each attribute update
      for (const attr of attributeUpdates) {
        try {
          // Check if attribute is valid for this category
          const mapping = await tx.attribute_category_mapping.findFirst({
            where: {
              attribute_id: attr.attribute_id,
              attribute_category_id: product.category_id,
              is_active: true,
              is_deleted: false,
            },
          });

          if (!mapping) {
            missingAttributeExceptions.push(
              `Attribute ${attr.attribute_id} is not valid for this product category`,
            );
            continue; // Skip this attribute and continue with the next one
          }

          // Validate and process attribute value
          const processedValue =
            await this.productValidationService.validateAndProcessAttributeValue(
              tx,
              {
                attribute_id: attr.attribute_id,
                dataType: mapping.data_type,
                value: attr.value,
                is_mandatory: attr.is_mandatory
              },
            );

          // Update or create the attribute value mapping
          const updatedMapping = await tx.attribute_value_mapping.upsert({
            where: {
              attribute_category_mapping_id_product_id: {
                attribute_category_mapping_id: Number(mapping.id),
                product_id: Number(productId),
              },
            },
            update: {
              string_value: processedValue.stringVal,
              number_value: processedValue.numberVal,
              boolean_value: processedValue.boolVal,
              lookup_name: processedValue.lookupName,
              lookup_id: processedValue.lookupId,
              date_value: processedValue.dateVal,
              updated_by: userId,
              updated_at: new Date(),
            },
            create: {
              attribute_category_mapping_id: mapping.id,
              product_id: productId,
              string_value: processedValue.stringVal,
              number_value: processedValue.numberVal,
              boolean_value: processedValue.boolVal,
              lookup_name: processedValue.lookupName,
              lookup_id: processedValue.lookupId,
              date_value: processedValue.dateVal,
              created_by: userId,
            },
          });

          successfulUpdates.push({
            attribute_id: attr.attribute_id,
            mapping: updatedMapping,
          });

          console.log('Updated mapping:', updatedMapping);
        } catch (validationError: any) {
          // Catch validation errors for individual attributes
          validationErrors.push(
            `Attribute ${attr.attribute_id}: ${
              validationError.message || validationError
            }`,
          );
          continue; // Continue processing other attributes
        }
      }

      // Log successful updates
      if (successfulUpdates.length > 0) {
        console.log(
          `Successfully updated ${successfulUpdates.length} attributes`,
        );
      }

      // Throw accumulated exceptions if any exist
      const allErrors = [...missingAttributeExceptions, ...validationErrors];
      if (allErrors.length > 0) {
        const errorMessage = allErrors.join('; ');

        // You can choose the appropriate exception type based on your needs
        if (
          missingAttributeExceptions.length > 0 &&
          validationErrors.length === 0
        ) {
          throw new BadRequestException(`Invalid attributes: ${errorMessage}`);
        } else if (
          validationErrors.length > 0 &&
          missingAttributeExceptions.length === 0
        ) {
          throw new BadRequestException(`Validation errors: ${errorMessage}`);
        } else {
          throw new BadRequestException(`Attribute errors: ${errorMessage}`);
        }
      }

      return {
        successfulUpdates: successfulUpdates.length,
        totalProcessed: attributeUpdates.length,
      };
    } catch (error) {
      // Only re-throw if it's one of our custom exceptions
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      console.error('Error updating product attributes:', error);
      throw new Error('Failed to update product attributes');
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
        await this.prisma.attribute_category_mapping.findUnique({
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

      const createdMapping =
        await this.prisma.attribute_category_mapping.create({
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
