/* eslint-disable no-case-declarations */
import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import ApiResponse from '@Helper/api-response';
import ResponseHelper from '@Helper/response-helper';
import Constants from '@Helper/constants';
import { ProductRepository } from '@Repository/product.repository';
import { CustomFilter } from '@Common/enums/custom-filter.enum';
import { ProductVariantService } from './product-variant.service';
import { CustomFilterConfiguratorService } from './custom-filter-configurator.service';
import { CustomProductVariantCategoryService } from './custom-product-category.service';
import { ProductSummaryOutputDTO } from '@DTO/product.summary.info.dto';
import { ProductImageOutput } from '@DTO/product.images.info.dto';
// Define a new DTO type for this specific minimal response
// You should define this interface/class in a DTO file, e.g., products/dtos/minimal-product-variant-response.dto.ts
interface MinimalProductVariantResponseDto {
  product_variant_id: bigint;
  productName: string;
  productTitle?: string; // Title is optional in your schema
  productDescription?: string; // Description is optional in your schema
  currencySymbol: string;
}
@Injectable()
export class ProductService {
  constructor(
    private readonly repository: ProductRepository,
    private readonly productVariantService: ProductVariantService,
    private readonly customFilterConfiguratorService: CustomFilterConfiguratorService,
    private readonly customProductCategoryService: CustomProductVariantCategoryService,
  ) {}

  /**
   * Retrieves a summary of product information including name, title, average rating,
   * formatted price, all associated color options from its variants, and images.
   * @param productId The ID of the product to retrieve.
   * @returns A Promise that resolves to a ProductSummaryOutputDTO object.
   * @throws NotFoundException if the product is not found or is deleted.
   */
  async getProductSummary(
    productId: bigint,
  ): Promise<ApiResponse<ProductSummaryOutputDTO>> {
    const productData = (await this.repository.getProductSummary(
      productId,
    )) as any;

    if (!productData) {
      throw new NotFoundException(
        `Product with ID ${productId} not found or is deleted.`,
      );
    }

    // 1. Calculate Average Rating
    const totalRatings = productData.productReviews.reduce(
      (sum: number, review: any) => sum + review.ratings,
      0,
    );

    const averageRating =
      productData.productReviews.length > 0
        ? parseFloat(
            (totalRatings / productData.productReviews.length).toFixed(1),
          )
        : 0;

    // 2. Determine Price with Currency Symbol
    const firstActiveVariant = productData.productVariants.find(
      (variant: any) => !variant.is_deleted,
    );
    const price = firstActiveVariant
      ? `${
          firstActiveVariant.currency?.symbol || '$'
        }${firstActiveVariant.price.toFixed(2)}`
      : 'N/A';

    // 3. Extract Unique Color Information
    const uniqueColorsMap = new Map<
      number,
      {
        id: number;
        variantId: number;
        name: string;
        hexCode?: string;
        inStock: boolean;
      }
    >();

    productData.productVariants.forEach((variant: any) => {
      if (variant.color) {
        uniqueColorsMap.set(variant.id, {
          variantId: variant.id,
          id: variant.color.id,
          name: variant.color.name,
          hexCode: variant.color.hex_code || '#000000',
          inStock: variant.quantity > 0,
        });
      }
    });

    const colors = Array.from(uniqueColorsMap.values());

    // 4. Extract Image Information
    const uniqueImagesMap = new Map<string, ProductImageOutput>(); // Use img_url as key for uniqueness
    productData.productVariants.forEach((variant: any) => {
      variant.image.forEach((img: any) => {
        if (!uniqueImagesMap.has(img.img_url)) {
          // Add only if URL is not already present
          uniqueImagesMap.set(img.img_url, {
            url: img.img_url,
            altText: img.alt_text,
            order: img.order,
          });
        }
      });
    });

    const images = Array.from(uniqueImagesMap.values());

    // Construct the final output
    const summary: ProductSummaryOutputDTO = {
      id: productData.id,
      name: productData.name,
      title: productData.title || null,
      averageRating: averageRating,
      price: price,
      colors: colors,
      images: images,
    };

    return ResponseHelper.CreateResponse<ProductSummaryOutputDTO>(
      '',
      summary,
      HttpStatus.OK,
    );
  }

  // TODO: High Priority: Need to optimize this method in such a way only one request must be done on the DB side.
  async getProductListingFiltered(
    pageNumber: number,
    pageSize: number,
    isAccessory: boolean,
    order?: object,
    where?: object,
    select?: object,
    customCategoryExpression?: CustomFilter,
  ): Promise<ApiResponse<any[]>> {
    let finalWhere: any;
    finalWhere = {
      product: {
        is_deleted: false,
        is_accessory: isAccessory,
      },
      ...where,
      currency: {
        is_deleted: false,
      },
    };
    let finalOrderBy: any = { ...order };
    if (customCategoryExpression) {
      const configuratorData = await this.getConfiguratorEntries();

      switch (customCategoryExpression) {
        case CustomFilter.NEW_ARRIVAL:
          const newArrivalDaysStr =
            configuratorData.get(CustomFilter.NEW_ARRIVAL)?.value || '30';
          const newArrivalDays = parseInt(newArrivalDaysStr, 10);
          finalWhere.product = {
            ...finalWhere.product,
            created_at: {
              gte: new Date(Date.now() - newArrivalDays * 24 * 60 * 60 * 1000),
            },
          };
          finalOrderBy = { ...finalOrderBy, created_at: 'desc' };
          break;
        case CustomFilter.TOP_SELLER:
        case CustomFilter.BEST_SELLER:
        case CustomFilter.POPULAR:
          const configEntry = configuratorData.get(customCategoryExpression);
          if (!configEntry) {
            console.warn(
              ` ${Constants.NO_CONFIGURATION_FOUND_FOR_CUSTOM_FILTER_CATEGORY} ${customCategoryExpression}.`,
            );
            console.warn(Constants.NO_ASSIGNMENT_FOR_SPECIAL_FILTERS_CATEGORY);
            throw new NotFoundException(Constants.NO_DATA_FOUND_FILTER);
          }
          const customConfigId = configEntry.id;
          // TODO: Will update this criteria to match real requirement.
          const customCategoryEntries =
            await this.customProductCategoryService.findMany(
              {
                custom_filter_configuration_id: customConfigId,
                valid_from: { lte: new Date() },
                OR: [{ valid_to: null }, { valid_to: { gte: new Date() } }],
              },
              {
                product_variant_id: true,
              },
            );
          const filteredVariantIds = customCategoryEntries.map(
            (entry: any) => entry.product_variant_id,
          );
          console.warn(Constants.NO_ASSIGNMENT_FOR_SPECIAL_FILTERS_CATEGORY);
          if (filteredVariantIds.length === 0) {
            throw new NotFoundException(Constants.NO_DATA_FOUND_FILTER);
          }
          finalWhere = {
            AND: [finalWhere, { id: { in: filteredVariantIds } }],
          };
          break;
      }
    }

    // This ensures all necessary related data is fetched.
    const selectOptions: any = {
      id: true,
      base_image_url: true,
      price: true,
      product: {
        select: { id: true, ...select },
      },
      currency: {
        select: {
          // Use select on currency_exchange to get only curr (currency symbol)
          curr: true,
        },
      },
    };

    const response = await this.productVariantService.getAllPagedData(
      pageNumber,
      pageSize,
      finalOrderBy,
      finalWhere,
      selectOptions,
    );

    if (!response.data || response.data?.length === 0) {
      throw new NotFoundException(Constants.NO_DATA_FOUND_FILTER);
    }
    const result = response.data.map(
      (pv: {
        id: bigint;
        base_image_url: string;
        product: {
          id: bigint;
          name: string;
          description: string;
          Title: string;
        };
        price: number;
        currency: { curr: string };
      }) => ({
        product_variant_id: pv.id,
        id: pv.product.id,
        name: pv.product.name,
        title: pv.product.Title,
        currencySymbol: pv.currency.curr,
        image_url: pv.base_image_url,
        price: pv.price.toFixed(2),
      }),
    );

    return ResponseHelper.CreateResponse<any[]>(
      '',
      result,
      HttpStatus.OK,
      response.getMeta(),
    );
  }

  /**
   * Fetches configurable thresholds/category IDs from the Configurator table.
   * Caches results if needed for performance.
   */
  private async getConfiguratorEntries(): Promise<
    Map<string, { id: bigint; value: string }>
  > {
    const configs = await this.customFilterConfiguratorService.getAllPagedData(
      1,
      Constants.MAX_PAGE_SIZE,
      {
        select: { id: true, key: true, value: true },
      },
    );
    return new Map(
      configs?.data?.map((c) => [c.key, { id: c.id, value: c.value }]),
    );
  }
}
