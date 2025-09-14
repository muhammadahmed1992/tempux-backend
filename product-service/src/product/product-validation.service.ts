// product-validation.service.ts
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

  // TODO: Separate validate, db and business logic
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

    console.log('where', productInfo.category_id);

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
    console.log('Attributes DTO:', attributesDto);

    // 4. Validate mandatory attributes
    const mandatoryMappings = mappings.filter((m) => m.is_mandatory);
    // console.log('Mandatory Mappings:', mandatoryMappings);
    for (const mm of mandatoryMappings) {
      const exists = attributesDto?.some(
        (av: any) => av.attribute_id === mm.attribute_id,
      );
      if (!exists) {
        missingMandatoryAttributes.add(mm.attribute_id);
      }
    }

    // 5. Validate attribute values - collect all errors instead of throwing immediately
    for (const attr of attributesDto) {
      try {
        const mapping = mappings.find(
          (m) => m.attribute_id === attr.attribute_id,
        );

        if (!mapping) {
          invalidAttributes.add(attr.attribute_id);
          continue; // Skip validation for this attribute and continue with next
        }

        // Use the new unified method that both validates and processes
        await this.validateAndProcessAttributeValue(tx, attr);
      } catch (validationError: any) {
        // Collect individual attribute validation errors
        attributeValidationErrors.push({
          attributeId: attr.attribute_id,
          error: validationError.message || validationError.toString(),
        });
        continue; // Continue processing other attributes
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

      // Create a custom exception with structured data
      if (errorDetails) {
        const error = new BadRequestException(errorMessage);
        (error as any).validationDetails = JSON.stringify(errorDetails);
        throw error;
      }
    }
  }

  /**
   * Validates attributes for draft products being published
   * handles existing attribute value mappings
   */
  // async validateDraftForPublish(
  //   tx: Prisma.TransactionClient,
  //   draftProduct: any,
  //   userId: bigint,
  // ): Promise<void> {
  //   const dto = {
  //     attributeValues: draftProduct.attributeValues.map((av: any) => ({
  //       attribute_id: av.attributeCategoryMapping.attribute_id,
  //       dataType: av.attributeCategoryMapping.data_type,
  //       value: this.extractStoredAttributeValue(av),
  //     })),
  //   };

  //   await this.validateForPublish(tx, draftProduct, dto, userId);
  // }

  /**
   * Helper method to extract the appropriate value from a stored attribute value mapping
   */
  private extractStoredAttributeValue(av: any): any {
    return (
      av.string_value ??
      av.number_value ??
      av.boolean_value ??
      av.date_value ??
      av.lookup_id ??
      null
    );
  }

  /**
   * Validates and processes an attribute value, returning the processed data
   */
  async validateAndProcessAttributeValue(
    tx: Prisma.TransactionClient,
    attr: AttributeDto,
  ): Promise<ProcessedAttributeValue> {
    const result: ProcessedAttributeValue = {
      stringVal: null,
      numberVal: null,
      boolVal: null,
      dateVal: null,
      lookupId: null,
      lookupName: null,
    };

    switch (attr.dataType) {
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
        const foundLookupName = await this.prisma.attributes.findUnique({
          where: { id: attr.attribute_id },
          select: { name: true },
        });

        if (!foundLookupName) {
          throw new BadRequestException(
            `Lookup attribute with ID ${attr.attribute_id} not found`,
          );
        }

        const selectedLookup = this.allowedLookups.find(
          (lookup) => lookup.attributeName === foundLookupName.name,
        );

        if (!selectedLookup) {
          throw new BadRequestException(
            `Attribute ${foundLookupName.name} is not allowed for lookup type`,
          );
        }

        const lookupRecord = await (
          this.prisma[
            selectedLookup.lookupTableName as keyof typeof this.prisma
          ] as any
        ).findUnique({ where: { id: lookupId } });

        if (!lookupRecord) {
          throw new BadRequestException(
            `Lookup record with ID ${lookupId} not found in ${selectedLookup.lookupTableName}`,
          );
        }

        result.lookupId = lookupId;
        result.lookupName = foundLookupName.name;
        break;

      default:
        throw new BadRequestException(
          `Unsupported data type: ${attr.dataType}`,
        );
    }

    return result;
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
