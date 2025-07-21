/* eslint-disable no-case-declarations */
import { HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import ApiResponse from "@Helper/api-response";
import { SetupListingDTO } from "@DTO/setup-listing.dto";
import ResponseHelper from "@Helper/response-helper";
import Constants from "@Helper/constants";
import { ProductRepository } from "@Repository/product.repository";
import { CustomFilter } from "@Common/enums/custom-filter.enum";
import { ProductVariantService } from "./product-variant.service";
import { CustomFilterConfiguratorService } from "./custom-filter-configurator.service";
import { CustomProductVariantCategoryService } from "./custom-product-category.service";
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
    private readonly customProductCategoryService: CustomProductVariantCategoryService
  ) {}

  // TODO: High Priority: Need to optimize this method in such a way only one request must be done on the DB side.
  async getProductListingFiltered(
    pageNumber: number,
    pageSize: number,
    isAccessory: boolean,
    order?: object,
    where?: object,
    select?: object,
    customCategoryExpression?: CustomFilter
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
            configuratorData.get(CustomFilter.NEW_ARRIVAL)?.value || "30";
          const newArrivalDays = parseInt(newArrivalDaysStr, 10);
          finalWhere.product = {
            ...finalWhere.product,
            created_at: {
              gte: new Date(Date.now() - newArrivalDays * 24 * 60 * 60 * 1000),
            },
          };
          finalOrderBy = { ...finalOrderBy, created_at: "desc" };
          break;
        case CustomFilter.TOP_SELLER:
        case CustomFilter.BEST_SELLER:
        case CustomFilter.POPULAR:
          const configEntry = configuratorData.get(customCategoryExpression);
          if (!configEntry) {
            console.warn(
              ` ${Constants.NO_CONFIGURATION_FOUND_FOR_CUSTOM_FILTER_CATEGORY} ${customCategoryExpression}.`
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
              }
            );
          const filteredVariantIds = customCategoryEntries.map(
            (entry: any) => entry.product_variant_id
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
      selectOptions
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
      })
    );

    return ResponseHelper.CreateResponse<any[]>(
      "",
      result,
      HttpStatus.OK,
      response.getMeta()
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
      }
    );
    return new Map(
      configs?.data?.map((c) => [c.key, { id: c.id, value: c.value }])
    );
  }
}
