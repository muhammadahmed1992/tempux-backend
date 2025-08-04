/* eslint-disable no-case-declarations */
import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import ApiResponse from '@Helper/api-response';
import ResponseHelper from '@Helper/response-helper';
import Constants from '@Helper/constants';
import { ProductRepository } from '@Repository/product.repository';
import { CustomFilter } from '@Common/enums/custom-filter.enum';
import { ProductVariantService } from './product-variant.service';
import { CustomFilterConfiguratorService } from './custom-filter-configurator.service';
import { CustomProductVariantCategoryService } from './custom-product-category.service';
import { ProductSummaryOutputDTO } from '@DTO/product-summary.info.dto';
import { ProductImageOutput } from '@DTO/product-images-info.dto';
import { ProductAnalyticsService } from './product-analytics.service';

/**
 * Define types used only in this service
 */
type ProductSummaryResult = any;
type ViewershipCountResult = number;

@Injectable()
export class ProductService {
  constructor(
    private readonly repository: ProductRepository,
    private readonly productVariantService: ProductVariantService,
    private readonly customFilterConfiguratorService: CustomFilterConfiguratorService,
    private readonly customProductCategoryService: CustomProductVariantCategoryService,
    private readonly productAnalytics: ProductAnalyticsService,
  ) {}

  /**
   * Retrieves a summary of product information including name, title, average rating,
   * formatted price, all associated color options from its variants, and images.
   * @param productId The ID of the product to retrieve.
   * @returns A Promise that resolves to a ProductSummaryOutputDTO object.
   * @throws NotFoundException if the product is not found or is deleted.
   */
  async getProductSummary(
    userId: bigint | null,
    productId: bigint,
  ): Promise<ApiResponse<ProductSummaryOutputDTO>> {
    // Initialize default values
    let productData: ProductSummaryResult | null = null;
    let viewershipCount: ViewershipCountResult = 0;

    const [productResult, viewerShipCountResult] = await Promise.allSettled([
      this.repository.getProductSummary(userId, productId),
      this.productAnalytics.getProductUniqueViewershipCount(productId),
    ]);

    // Handle product data result
    if (productResult.status === 'fulfilled') {
      productData = productResult.value;
      if (!productData) {
        console.warn(`Product with ID ${productId} not found.`);
        throw new NotFoundException(`Product with ID ${productId} not found.`);
      }
    } else {
      // Product data fetching failed
      // TODO: This can be improved later on
      console.error(
        `Error fetching product summary for ID ${productId}:`,
        productResult.reason,
      );
      // TODO: This can be improved later on
      console.error(productResult.reason);
      throw new InternalServerErrorException(
        `There is an error while making a request`,
      );
    }

    // Failure should not block the main product processing...
    if (viewerShipCountResult.status === 'fulfilled') {
      viewershipCount = viewerShipCountResult?.value?.data;
    } else {
      console.warn(
        `Could not fetch viewership count for product ID ${productId}:`,
        viewerShipCountResult.reason,
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
    const price = firstActiveVariant.price.toFixed(2);

    // 3. Extract Unique Color Information
    const uniqueColorsMap = new Map<
      number,
      {
        id: number;
        itemId: number;
        name: string;
        hexCode?: string;
        price: number;
        discount: number;
        inStock: boolean;
        isFavorite: boolean | null;
      }
    >();

    productData.productVariants.forEach((variant: any, idx: number) => {
      if (variant.color) {
        uniqueColorsMap.set(variant.id, {
          itemId: variant.id,
          id: variant.color.id,
          name: variant.color.name,
          hexCode: variant.color.hex_code || '#000000',
          price: variant.price.toFixed(2),
          discount: variant.discount ? variant.discount.toFixed(2) : 0,
          inStock: variant.quantity > 0,
          isFavorite: variant.productVariantFavorite
            ? !!variant.productVariantFavorite[idx]?.id
            : null,
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

    // Construct the final output.
    // Will adjust later if we can have mult-currency feature.
    const summary: ProductSummaryOutputDTO = {
      id: productData.id,
      name: productData.name,
      title: productData.title || null,
      averageRating: averageRating,
      price: price,
      symbol: firstActiveVariant.currency?.symbol || '$',
      colors: colors,
      images: images,
      viewerShipCount: viewershipCount || 0,
    };

    return ResponseHelper.CreateResponse<ProductSummaryOutputDTO>(
      '',
      summary,
      HttpStatus.OK,
    );
  }

  // TODO: High Priority: Need to optimize this method in such a way only one request must be done on the DB side.
  // TODO: Move queries into repository class
  async getProductListingFiltered(
    pageNumber: number,
    pageSize: number,
    isAccessory: boolean,
    userId?: bigint,
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
      sku: true,
      base_image_url: true,
      price: true,
      product: {
        select: {
          id: true,
          product_slug: true,
          title: true,
          description: true,
          ...select,
          productTags: {
            select: {
              tags: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      ...(userId && {
        productVariantFavorite: {
          where: {
            user_id: userId,
            is_deleted: false,
          },
          select: {
            id: true,
          },
        },
      }),
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
          title: string;
          product_slug: string;
          productTags: any[];
        };
        price: number;
        description: string;
        title: string;
        currency: { curr: string };
        productVariantFavorite: any;
      }) => ({
        itemId: pv.id,
        productId: pv.product.id,
        slug: pv.product.product_slug,
        name: pv.product.name,
        title: pv.product.title,
        description: pv.product.description,
        symb: pv.currency.curr,
        image_url: pv.base_image_url,
        price: pv.price.toFixed(2),
        isFavorite: userId ? !!pv.productVariantFavorite?.[0]?.id : null,
        tags: pv.product?.productTags?.map((p) => p.tags),
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
