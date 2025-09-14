// product-validation.service.ts - Optimized with Batch Operations
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { SlugService } from 'src/slug/slug.service';
import { AttributeDto } from '@DTO/product.dto';

// Define types for better type safety
interface ProcessedAttributeValue {
  stringVal: string | null;
  numberVal: Prisma.Decimal | null;
  boolVal: boolean | null;
  dateVal: Date | null;
  lookupId: number | null;
  lookupName: string | null;
}

interface LookupConfig {
  attributeName: string;
  lookupTableName: string;
}

interface BatchLookupResult {
  [attributeId: number]: {
    lookupRecord: any;
    lookupConfig: LookupConfig;
  };
}

@Injectable()
export class ProductValidationService {
  private readonly allowedLookups: LookupConfig[] = [
    { attributeName: 'condition', lookupTableName: 'condition' },
    { attributeName: 'caliber_movement', lookupTableName: 'movement' },
    { attributeName: 'crystal_type', lookupTableName: 'crystal' },
    { attributeName: 'bazel_material', lookupTableName: 'material' },
    { attributeName: 'case_material', lookupTableName: 'material' },
    { attributeName: 'bracelet_material', lookupTableName: 'material' },
    { attributeName: 'dial_color', lookupTableName: 'color' },
    { attributeName: 'bracelet_color', lookupTableName: 'color' },
    { attributeName: 'inclusions', lookupTableName: 'product_inclusion' },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly slugService: SlugService,
  ) {}

  async validateForPublish(
    tx: Prisma.TransactionClient,
    productInfo: any,
    attributesDto: AttributeDto[],
    userId: bigint,
  ): Promise<void> {
    // Arrays to collect unique validation errors
    const missingMandatoryAttributes = new Set<number>();
    const invalidAttributes = new Set<number>();
    const attributeValidationErrors: { attributeId: number; error: string }[] =
      [];

    // 1. Gender handling for accessories
    const productGender = productInfo.is_accessory ? 3 : productInfo.gender_id;

    // 2. Generate slug
    const slugContent =
      productInfo.name +
      ' ' +
      (productInfo.is_accessory ? 'accessory' : 'watch') +
      ' ' +
      productGender;

    productInfo.generatedSlug = this.slugService.generateSlug(slugContent);

    // 3. Validate category mappings
    const mappings = await tx.attribute_category_mapping.findMany({
      where: {
        attribute_category_id: productInfo.category_id,
        is_active: true,
      },
    });

    if (!mappings.length) {
      throw new BadRequestException(
        `No attribute mappings found for category ${productInfo.category_id}`,
      );
    }

    // 4. Validate mandatory attributes
    const mandatoryMappings = mappings.filter((m) => m.is_mandatory);
    const providedAttributeIds = new Set(
      attributesDto.map((attr) => attr.attribute_id),
    );

    for (const mm of mandatoryMappings) {
      if (!providedAttributeIds.has(mm.attribute_id)) {
        missingMandatoryAttributes.add(mm.attribute_id);
      }
    }

    // 5. Batch validate attribute values
    const batchValidationResults = await this.batchValidateAndProcessAttributes(
      tx,
      attributesDto,
      mappings,
    );

    // Process results
    for (const result of batchValidationResults) {
      if (result.error) {
        if (result.error.includes('not valid for this product category')) {
          invalidAttributes.add(result.attributeId);
        } else {
          attributeValidationErrors.push({
            attributeId: result.attributeId,
            error: result.error,
          });
        }
      }
    }

    // 6. Throw structured error if any validation issues exist
    if (
      missingMandatoryAttributes.size > 0 ||
      invalidAttributes.size > 0 ||
      attributeValidationErrors.length > 0
    ) {
      const errorDetails = {
        categoryId: productInfo.category_id,
        errors: {
          ...(missingMandatoryAttributes.size > 0 && {
            missingMandatoryAttributes: Array.from(missingMandatoryAttributes),
          }),
          ...(invalidAttributes.size > 0 && {
            invalidAttributes: Array.from(invalidAttributes),
          }),
          ...(attributeValidationErrors.length > 0 && {
            validationErrors: attributeValidationErrors,
          }),
        },
      };

      // User-friendly message
      const messageParts: string[] = [];

      if (missingMandatoryAttributes.size > 0) {
        messageParts.push(
          `Missing mandatory attributes: ${Array.from(
            missingMandatoryAttributes,
          ).join(', ')}`,
        );
      }

      if (invalidAttributes.size > 0) {
        messageParts.push(
          `Invalid attributes for category: ${Array.from(
            invalidAttributes,
          ).join(', ')}`,
        );
      }

      if (attributeValidationErrors.length > 0) {
        messageParts.push(
          `Validation errors for attributes: ${attributeValidationErrors
            .map((e) => e.attributeId)
            .join(', ')}`,
        );
      }

      const errorMessage = messageParts.join('. ');

      const error = new BadRequestException(errorMessage);
      (error as any).validationDetails = JSON.stringify(errorDetails);
      throw error;
    }
  }

  /**
   * Batch validate and process multiple attributes
   */
  async batchValidateAndProcessAttributes(
    tx: Prisma.TransactionClient,
    attributesDto: AttributeDto[],
    mappings: any[],
  ): Promise<
    Array<{
      attributeId: number;
      processedValue?: ProcessedAttributeValue;
      error?: string;
    }>
  > {
    // Group attributes by data type for batch processing
    const attributesByType = this.groupAttributesByType(
      attributesDto,
      mappings,
    );

    // Batch fetch lookup data
    const batchLookupResults = await this.batchFetchLookupData(
      tx,
      attributesByType.lookup || [],
    );

    const results: Array<{
      attributeId: number;
      processedValue?: ProcessedAttributeValue;
      error?: string;
    }> = [];

    // Process each attribute
    for (const attr of attributesDto) {
      try {
        const mapping = mappings.find(
          (m) => m.attribute_id === attr.attribute_id,
        );

        if (!mapping) {
          results.push({
            attributeId: attr.attribute_id,
            error: `Attribute ${attr.attribute_id} is not valid for this product category`,
          });
          continue;
        }

        const processedValue = await this.processAttributeValueWithBatchData(
          attr,
          mapping,
          batchLookupResults,
        );

        results.push({
          attributeId: attr.attribute_id,
          processedValue,
        });
      } catch (error: any) {
        results.push({
          attributeId: attr.attribute_id,
          error: error.message || error.toString(),
        });
      }
    }

    return results;
  }

  /**
   * Group attributes by their data types for batch processing
   */
  private groupAttributesByType(
    attributesDto: AttributeDto[],
    mappings: any[],
  ): Record<string, Array<{ attr: AttributeDto; mapping: any }>> {
    const grouped: Record<
      string,
      Array<{ attr: AttributeDto; mapping: any }>
    > = {};

    for (const attr of attributesDto) {
      const mapping = mappings.find(
        (m) => m.attribute_id === attr.attribute_id,
      );
      if (!mapping) continue;

      const dataType = attr.dataType || mapping.data_type;
      if (!grouped[dataType]) {
        grouped[dataType] = [];
      }

      grouped[dataType].push({ attr, mapping });
    }

    return grouped;
  }

  /**
   * Batch fetch all lookup data needed for validation
   */
  async batchFetchLookupData(
    tx: Prisma.TransactionClient,
    lookupAttributes: Array<{ attr: AttributeDto; mapping: any }>,
  ): Promise<BatchLookupResult> {
    if (lookupAttributes.length === 0) {
      return {};
    }

    const result: BatchLookupResult = {};

    // Extract unique attribute IDs for lookup attributes
    const attributeIds = [
      ...new Set(lookupAttributes.map((la) => la.attr.attribute_id)),
    ];

    // Batch fetch attribute names
    const attributeNames = await tx.attributes.findMany({
      where: { id: { in: attributeIds } },
      select: { id: true, name: true },
    });

    // Group by lookup table for batch queries
    const lookupsByTable: Record<
      string,
      Array<{
        attributeId: number;
        lookupId: number;
        lookupConfig: LookupConfig;
      }>
    > = {};

    for (const { attr } of lookupAttributes) {
      const attributeName = attributeNames.find(
        (an) => an.id === attr.attribute_id,
      );
      if (!attributeName) continue;

      const lookupConfig = this.allowedLookups.find(
        (lookup) => lookup.attributeName === attributeName.name,
      );
      if (!lookupConfig) continue;

      const lookupId = Number(attr.value);
      if (isNaN(lookupId)) continue;

      const tableName = lookupConfig.lookupTableName;
      if (!lookupsByTable[tableName]) {
        lookupsByTable[tableName] = [];
      }

      lookupsByTable[tableName].push({
        attributeId: attr.attribute_id,
        lookupId,
        lookupConfig,
      });
    }

    // Batch fetch from each lookup table
    const fetchPromises = Object.entries(lookupsByTable).map(
      async ([tableName, items]) => {
        const lookupIds = [...new Set(items.map((item) => item.lookupId))];

        try {
          const lookupRecords = await (
            tx[tableName as keyof typeof tx] as any
          ).findMany({
            where: { id: { in: lookupIds } },
          });

          // Map results back to attribute IDs
          const recordMap = new Map(
            lookupRecords.map((record: any) => [record.id, record]),
          );

          for (const item of items) {
            const lookupRecord = recordMap.get(item.lookupId);
            if (lookupRecord) {
              result[item.attributeId] = {
                lookupRecord,
                lookupConfig: item.lookupConfig,
              };
            }
          }
        } catch (error) {
          console.error(`Error fetching from ${tableName}:`, error);
          // Continue processing other tables
        }
      },
    );

    await Promise.all(fetchPromises);
    return result;
  }

  /**
   * Process attribute value using pre-fetched batch data
   */
  async processAttributeValueWithBatchData(
    attr: AttributeDto,
    mapping: any,
    batchLookupResults: BatchLookupResult,
  ): Promise<ProcessedAttributeValue> {
    const result: ProcessedAttributeValue = {
      stringVal: null,
      numberVal: null,
      boolVal: null,
      dateVal: null,
      lookupId: null,
      lookupName: null,
    };

    const dataType = attr.dataType || mapping.data_type;

    switch (dataType) {
      case 'string':
        result.stringVal = String(attr.value);
        break;

      case 'number':
        if (isNaN(Number(attr.value))) {
          throw new BadRequestException(
            `Invalid number value for attribute ${attr.attribute_id}`,
          );
        }
        result.numberVal = new Prisma.Decimal(attr.value);
        break;

      case 'boolean':
        if (typeof attr.value !== 'boolean') {
          throw new BadRequestException(
            `Invalid boolean value for attribute ${attr.attribute_id}`,
          );
        }
        result.boolVal = Boolean(attr.value);
        break;

      case 'date':
        if (isNaN(Date.parse(attr.value))) {
          throw new BadRequestException(
            `Invalid date value for attribute ${attr.attribute_id}`,
          );
        }
        result.dateVal = new Date(attr.value);
        break;

      case 'lookup':
        const lookupId = Number(attr.value);
        const batchResult = batchLookupResults[attr.attribute_id];

        if (!batchResult) {
          throw new BadRequestException(
            `Lookup validation failed for attribute ${attr.attribute_id}`,
          );
        }

        if (!batchResult.lookupRecord) {
          throw new BadRequestException(
            `Lookup record with ID ${lookupId} not found in ${batchResult.lookupConfig.lookupTableName}`,
          );
        }

        result.lookupId = lookupId;
        result.lookupName = batchResult.lookupConfig.attributeName;
        break;

      default:
        throw new BadRequestException(`Unsupported data type: ${dataType}`);
    }

    return result;
  }

  /**
   * Legacy method for backward compatibility - now uses batch processing internally
   */
  async validateAndProcessAttributeValue(
    tx: Prisma.TransactionClient,
    attr: AttributeDto,
  ): Promise<ProcessedAttributeValue> {
    // For single attribute, still use batch processing for consistency
    const batchResults = await this.batchValidateAndProcessAttributes(
      tx,
      [attr],
      [], // Will need to fetch mappings if used standalone
    );

    const result = batchResults[0];
    if (result.error) {
      throw new BadRequestException(result.error);
    }

    return result.processedValue!;
  }

  validateDraftProduct(product: any): void {
    const requiredFields = [
      'title',
      'description',
      'brand_id',
      'category_id',
      'model_id',
      'gender_id',
      'sales_price',
    ] as const;

    const missingFields = requiredFields.filter(
      (field) => !product[field] && product[field] !== 0,
    );

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Missing required fields: ${missingFields.join(', ')}`,
      );
    }
  }
}
