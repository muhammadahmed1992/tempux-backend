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
import {
  AttributeCategoryDto,
  AttributeCategoryMappingDto,
  AttributeCategoryMappingsResponseDto
} from '@Common/dto/attribute-category.dto';
import ApiResponse from '@Helper/api-response';
import Constants from '@Helper/constants';
import { AppLoggerService } from '@Common/logging';

interface BatchAttributeResult {
  attributeId: number;
  success: boolean;
  error?: string;
  mapping?: any;
}
@Injectable()
export class ProductAttributesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productValidationService: ProductValidationService,
    private readonly logger: AppLoggerService,
  ) { }

  /**
   * Fetches all attribute categories
   * @returns List of attribute categories with their IDs and metadata
   */
  async getAllAttributeCategories(): Promise<ApiResponse<AttributeCategoryDto[]>> {
    try {
      const categories = await this.prisma.attribute_categories.findMany({
        where: {
          is_deleted: false,
          is_active: true,
        },
        select: {
          id: true,
          name: true,
          is_active: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      if (!categories || categories.length === 0) {
        throw new NotFoundException(Constants.NO_DATA_FOUND);
      }

      return ResponseHelper.CreateResponse<AttributeCategoryDto[]>(
        Constants.DATA_SUCCESS,
        categories,
        HttpStatus.OK,
      );
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch attribute categories: ${error.message}`,
      );
    }
  }

  /**
   * Fetches all attribute mappings for a specific category
   * @param categoryId The ID of the attribute category
   * @returns Attribute mappings for the specified category
   */
  async getAttributeMappingsByCategory(categoryId: number): Promise<ApiResponse<AttributeCategoryMappingsResponseDto>> {
    try {
      // First check if the category exists
      const category = await this.prisma.attribute_categories.findUnique({
        where: {
          id: categoryId,
          is_deleted: false,
          is_active: true,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!category) {
        throw new NotFoundException(`Attribute category with ID ${categoryId} not found`);
      }

      // Get all attribute mappings for this category
      const mappings = await this.prisma.attribute_category_mapping.findMany({
        where: {
          attribute_category_id: categoryId,
          is_deleted: false,
          is_active: true,
        },
        select: {
          id: true,
          attribute_id: true,
          data_type: true,
          is_mandatory: true,
          control_type: true,
          attribute: {
            select: {
              name: true,
              display_name: true,
              unit: true,
            },
          },
        },
        orderBy: {
          id: 'asc',
        },
      });

      // Transform the data to match the expected response format
      const attributeMappings: AttributeCategoryMappingDto[] = mappings.map(mapping => ({
        id: mapping.id,
        attribute_id: mapping.attribute_id,
        attribute_name: mapping.attribute.name,
        attribute_display_name: mapping.attribute.display_name,
        attribute_unit: mapping.attribute.unit,
        data_type: mapping.data_type,
        is_mandatory: mapping.is_mandatory,
        control_type: mapping.control_type,
      }));

      const response: AttributeCategoryMappingsResponseDto = {
        categoryId: category.id,
        categoryName: category.name,
        attributes: attributeMappings,
      };

      return ResponseHelper.CreateResponse<AttributeCategoryMappingsResponseDto>(
        Constants.DATA_SUCCESS,
        response,
        HttpStatus.OK,
      );
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch attribute mappings: ${error.message}`,
      );
    }
  }

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
    } catch (error: any) {
      this.logger.error({
        message: 'Error fetching attributes by category:',
        error: error,
      });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch attributes by category: ${error.message}`,
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
      // Single query to get product with category
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

      // Batch fetch all required mappings in one query
      const attributeIds = attributeUpdates.map((attr) => attr.attribute_id);
      const mappings = await tx.attribute_category_mapping.findMany({
        where: {
          attribute_id: { in: attributeIds },
          attribute_category_id: product.category_id,
          is_active: true,
          is_deleted: false,
        },
      });

      // Create a mapping lookup for O(1) access
      const mappingLookup = new Map(mappings.map((m) => [m.attribute_id, m]));

      // Batch validate all attributes
      const validationResults =
        await this.productValidationService.batchValidateAndProcessAttributes(
          tx,
          attributeUpdates,
          mappings,
        );

      // Prepare batch operations
      const batchResults: BatchAttributeResult[] = [];
      const upsertOperations: Array<{
        mapping: any;
        processedValue: any;
        attributeId: number;
      }> = [];

      // Process validation results
      for (const result of validationResults) {
        if (result.error) {
          batchResults.push({
            attributeId: result.attributeId,
            success: false,
            error: result.error,
          });
          continue;
        }

        const mapping = mappingLookup.get(result.attributeId);
        if (!mapping) {
          batchResults.push({
            attributeId: result.attributeId,
            success: false,
            error: `Attribute ${result.attributeId} is not valid for this product category`,
          });
          continue;
        }

        upsertOperations.push({
          mapping,
          processedValue: result.processedValue!,
          attributeId: result.attributeId,
        });
      }

      // Execute batch upsert operations
      if (upsertOperations.length > 0) {
        const batchUpsertResults = await this.executeBatchUpserts(
          tx,
          productId,
          upsertOperations,
          userId,
        );

        // Merge successful operations into results
        batchUpsertResults.forEach((result) => {
          batchResults.push(result);
        });
      }

      // Calculate summary
      const successfulUpdates = batchResults.filter((r) => r.success).length;
      const errors = batchResults.filter((r) => !r.success);

      // Log results
      if (successfulUpdates > 0) {
        this.logger.info(`Successfully updated ${successfulUpdates} attributes`);
      }

      if (errors.length > 0) {
        this.logger.error({
          message:
            `Failed to update ${errors.length} attributes:`,
          error: new Error(errors.map((e) => `${e.attributeId}: ${e.error}`).join(', ')),
        }
        );
      }

      // Throw accumulated errors if all operations failed
      if (errors.length > 0 && successfulUpdates === 0) {
        const errorMessage = errors
          .map((e) => `Attribute ${e.attributeId}: ${e.error}`)
          .join('; ');
        throw new BadRequestException(
          `All attribute updates failed: ${errorMessage}`,
        );
      }

      // Return results with partial success information
      const result = {
        successfulUpdates,
        totalProcessed: attributeUpdates.length,
        errors: errors.length > 0 ? errors : undefined,
      };

      // If there were some errors but also some successes, log warning but don't throw
      if (errors.length > 0 && successfulUpdates > 0) {
        this.logger.warn(
          `Partial success: ${successfulUpdates}/${attributeUpdates.length} attributes updated`,
        );
      }

      return result;
    } catch (error: any) {
      // Only re-throw if it's one of our custom exceptions
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error('Error updating product attributes:', error);
      throw new Error('Failed to update product attributes');
    }
  }

  /**
   * Execute batch upsert operations using Promise.allSettled for better error handling
   */
  private async executeBatchUpserts(
    tx: Prisma.TransactionClient,
    productId: bigint,
    operations: Array<{
      mapping: any;
      processedValue: any;
      attributeId: number;
    }>,
    userId: bigint,
  ): Promise<BatchAttributeResult[]> {
    // Execute all upserts in parallel with error isolation
    const upsertPromises = operations.map(async (op) => {
      try {
        const updatedMapping = await tx.attribute_value_mapping.upsert({
          where: {
            attribute_category_mapping_id_product_id: {
              attribute_category_mapping_id: Number(op.mapping.id),
              product_id: Number(productId),
            },
          },
          update: {
            string_value: op.processedValue.stringVal,
            number_value: op.processedValue.numberVal,
            boolean_value: op.processedValue.boolVal,
            lookup_name: op.processedValue.lookupName,
            lookup_id: op.processedValue.lookupId,
            date_value: op.processedValue.dateVal,
            updated_by: userId,
            updated_at: new Date(),
          },
          create: {
            attribute_category_mapping_id: op.mapping.id,
            product_id: productId,
            string_value: op.processedValue.stringVal,
            number_value: op.processedValue.numberVal,
            boolean_value: op.processedValue.boolVal,
            lookup_name: op.processedValue.lookupName,
            lookup_id: op.processedValue.lookupId,
            date_value: op.processedValue.dateVal,
            created_by: userId,
          },
        });

        return {
          attributeId: op.attributeId,
          success: true,
          mapping: updatedMapping,
        };
      } catch (error: any) {
        this.logger.error({
          message: `Failed to upsert attribute value for attribute ID ${op.attributeId}`,
          error: error.message || 'Failed to upsert attribute value',
        });
        return {
          attributeId: op.attributeId,
          success: false,
          error: error.message || 'Failed to upsert attribute value',
        };
      }
    });

    // Wait for all operations to complete
    const results = await Promise.allSettled(upsertPromises);

    // Extract results from Promise.allSettled
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          attributeId: operations[index].attributeId,
          success: false,
          error: result.reason?.message || 'Promise rejected',
        };
      }
    });
  }

  /**
   * Batch fetch product attributes with all related data
   */
  async batchFetchProductAttributes(
    tx: Prisma.TransactionClient,
    productIds: bigint[],
  ): Promise<Map<string, any[]>> {
    if (productIds.length === 0) {
      return new Map();
    }

    // Single query to fetch all attribute data for multiple products
    const attributeMappings = await tx.attribute_value_mapping.findMany({
      where: {
        product_id: { in: productIds },
      },
      include: {
        attributeCategoryMapping: {
          include: {
            attribute: true,
            attributeCategory: true,
          },
        },
      },
    });

    // Group by product ID
    const result = new Map<string, any[]>();

    for (const mapping of attributeMappings) {
      const productKey = mapping.product_id.toString();

      if (!result.has(productKey)) {
        result.set(productKey, []);
      }

      result.get(productKey)!.push({
        id: mapping.id,
        attributeId: mapping.attributeCategoryMapping.attribute_id,
        attributeName: mapping.attributeCategoryMapping.attribute.name,
        dataType: mapping.attributeCategoryMapping.data_type,
        value: this.extractAttributeValue(mapping),
        isMandatory: mapping.attributeCategoryMapping.is_mandatory,
        category: mapping.attributeCategoryMapping.attributeCategory,
      });
    }

    return result;
  }

  /**
   * Helper method to extract the appropriate value from a stored attribute value mapping
   */
  private extractAttributeValue(mapping: any): any {
    return (
      mapping.string_value ??
      mapping.number_value ??
      mapping.boolean_value ??
      mapping.date_value ??
      mapping.lookup_id ??
      null
    );
  }

  /**
   * Optimized method to check if all mandatory attributes are present
   */
  async validateMandatoryAttributesBatch(
    tx: Prisma.TransactionClient,
    productIds: bigint[],
    categoryId: number,
  ): Promise<Map<string, { isValid: boolean; missingAttributes: number[] }>> {
    if (productIds.length === 0) {
      return new Map();
    }

    // Get all mandatory attributes for the category
    const mandatoryMappings = await tx.attribute_category_mapping.findMany({
      where: {
        attribute_category_id: categoryId,
        is_mandatory: true,
        is_active: true,
        is_deleted: false,
      },
      select: {
        attribute_id: true,
      },
    });

    const mandatoryAttributeIds = new Set(
      mandatoryMappings.map((m) => m.attribute_id),
    );

    // Get all existing attribute mappings for these products
    const existingMappings = await tx.attribute_value_mapping.findMany({
      where: {
        product_id: { in: productIds },
      },
      include: {
        attributeCategoryMapping: {
          select: {
            attribute_id: true,
          },
        },
      },
    });

    // Group by product and check completeness
    const productAttributeMap = new Map<string, Set<number>>();

    for (const mapping of existingMappings) {
      const productKey = mapping.product_id.toString();
      const attributeId = mapping.attributeCategoryMapping.attribute_id;

      if (!productAttributeMap.has(productKey)) {
        productAttributeMap.set(productKey, new Set());
      }

      productAttributeMap.get(productKey)!.add(attributeId);
    }

    // Check each product for missing mandatory attributes
    const result = new Map<
      string,
      { isValid: boolean; missingAttributes: number[] }
    >();

    for (const productId of productIds) {
      const productKey = productId.toString();
      const existingAttributes =
        productAttributeMap.get(productKey) || new Set();

      const missingAttributes: number[] = [];
      for (const requiredId of mandatoryAttributeIds) {
        if (!existingAttributes.has(requiredId)) {
          missingAttributes.push(requiredId);
        }
      }

      result.set(productKey, {
        isValid: missingAttributes.length === 0,
        missingAttributes,
      });
    }

    return result;
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
    } catch (error: any) {
      this.logger.error('Error creating attribute-category mapping:', error);
      return ResponseHelper.CreateResponse(
        'Failed to create mapping',
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
