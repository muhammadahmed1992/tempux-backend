import ApiResponse from '@Helper/api-response';
import { ProductAnalyticsService } from '@ProductAnalytics/product-analytics.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductCreatedEvent } from './event/product-created.event';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AttributeDto, CreateProductDto } from '@DTO/product.dto';
import { Prisma, product, PrismaClient } from '@prisma/client';
import { SlugService } from 'src/slug/slug.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CustomFilter } from '@Common/enums/custom-filter.enum';
import Constants from '@Helper/constants';
import ResponseHelper from '@Helper/response-helper';
import { ProductSummaryOutputDTO } from '@DTO/product-summary.info.dto';
import { ProductRepository } from './product.repository';
import { ProductValidationService } from './product-validation.service';
import { ProductAttributesService } from 'src/product-attributes/product-attributes.service';
import { ImageUploadService } from 'src/image-upload/image-upload.service';
import { ImageUploadDto } from '@DTO/image-upload.dto';
import { AppLoggerService } from '@Common/logging';
import {
  OrderSummaryDTO,
  OrderSummaryProductDTO,
  TaxLineDTO,
} from '@DTO/order-summary-response.dto';
import { OrderSummaryRequestDTO } from '@DTO/order-summary-request.dto';
import { title } from 'process';

interface ProductSummaryResult {
  id: bigint;
  title: string;
  name: string;
  description: string;
  avgRating: number;
  sales_price: Prisma.Decimal;
  currency_id: number;
  deleted: boolean;
  model: any;
  productReviews: Array<{
    id: bigint;
    rating: number;
  }>;
  productImages: Array<{
    id: number;
    img_url: string;
    alt_text?: string;
    order: number;
  }>;
  currency: {
    id: number;
  };
}

type ViewershipCountResult = number;

// Mapping from CustomFilter enum to tag names in the DB
const CUSTOM_FILTER_TO_TAG: Record<CustomFilter, string> = {
  [CustomFilter.TOP_SELLER]: 'top-seller',
  [CustomFilter.BEST_SELLER]: 'best-seller',
  [CustomFilter.POPULAR]: 'popular',
  [CustomFilter.NEW_ARRIVAL]: 'new-arrival',
};

/**
 * Define types used only in this service
 */
interface ProductWithRelations
  extends Prisma.productGetPayload<{
    include: {
      productImages: true;
      productOwnership: true;
    };
  }> {}

interface ProductInfo {
  title?: string;
  description?: string;
  name?: string;
  brand_id?: number;
  category_id?: number;
  model_id?: number;
  gender_id?: number;
  is_accessory?: boolean;
  accessory_image?: string;
  seller_id?: bigint;
  sales_price?: number;
  currency_id?: number;
  year_of_production?: number;
}

@Injectable()
export class ProductService {
  constructor(
    private readonly productAnalytics: ProductAnalyticsService,
    private eventEmitter: EventEmitter2,
    private logger: AppLoggerService,
    private readonly productRepository: ProductRepository,
    private readonly productAnalyticsService: ProductAnalyticsService,
    private readonly slugService: SlugService,
    private readonly prisma: PrismaService,
    private readonly productValidationService: ProductValidationService,
    private readonly productAttributeService: ProductAttributesService,
    private readonly imageUploadService: ImageUploadService,
  ) {}

  // 3. Updated createProduct method with image handling
  async createProduct(
    dto: CreateProductDto,
    userId: bigint,
    imageFiles?: Express.Multer.File[],
    imageUploadDto?: ImageUploadDto,
  ) {
    try {
      const productInfo = dto.product;

      return this.prisma.$transaction(async (tx) => {
        // Existing validation
        await this.productValidationService.validateForPublish(
          tx,
          productInfo,
          dto.attributes.map((av) => ({
            attribute_id: av.attribute_id,
            value: av.value,
            dataType: av.dataType,
            is_mandatory: av.is_mandatory,
          })),
          userId,
        );

        // Generate slug and calculate pricing (existing code)
        const productGender = productInfo.is_accessory
          ? 3
          : productInfo.gender_id;
        const slugContent =
          productInfo.title +
          ' ' +
          (productInfo.is_accessory ? 'accessory' : 'watch') +
          ' ' +
          productGender;
        const generatedSlug = this.slugService.generateSlug(slugContent);

        const [commissionFee, payoutPrice] = await Promise.all([
          this.calculateEstimatedPayoutAndCommission(
            productInfo.sales_price,
            'commission',
          ),
          this.calculateEstimatedPayoutAndCommission(
            productInfo.sales_price,
            'payout',
          ),
        ]);

        // Create the product
        const newProduct = await tx.product.create({
          data: {
            title: productInfo.title,
            description: productInfo.description || '',
            name: productInfo.title || '',
            product_slug: generatedSlug,
            is_accessory: productInfo.is_accessory,
            brand_id: Number(productInfo.brand_id),
            seller_id: BigInt(userId),
            sales_price: new Prisma.Decimal(productInfo.sales_price),
            currency_id: Number(productInfo.currency_id) || 1,
            commission_fee: new Prisma.Decimal(commissionFee),
            payout_price: new Prisma.Decimal(payoutPrice),
            model_id: Number(productInfo.model_id) || null,
            year_of_production: productInfo.year_of_production,
            category_id: productInfo.category_id,
            created_by: userId,
          },
        });

        // Handle attributes
        const updatedAttributes =
          await this.productAttributeService.updateProductAttributes(
            tx,
            newProduct.id,
            dto.attributes,
            userId,
          );

        // Handle image uploads if provided
        let imageUploadResult = null;
        if (imageFiles && imageFiles.length > 0 && imageUploadDto) {
          try {
            // Set the product_id in the DTO now that we have it
            imageUploadDto.product_id = Number(newProduct.id);

            imageUploadResult =
              await this.imageUploadService.uploadProductImages(
                newProduct.id,
                imageUploadDto.imageType,
                imageFiles,
                imageUploadDto.altTexts,
                userId,
                tx,
              );
          } catch (imageError: any) {
            console.error('Image upload error:', imageError);
            imageUploadResult = {
              processedImages: 0,
              skippedImages: imageFiles.length,
              errors: [`Image upload failed: ${imageError.message}`],
              imageIds: [],
            };
          }
        }

        // Emit product created event
        setImmediate(() => {
          this.eventEmitter.emit(
            'product.created',
            new ProductCreatedEvent(userId, newProduct.id),
          );
        });

        return ResponseHelper.CreateResponse(
          'Product created successfully',
          {
            product: newProduct,
            attributesSummary: updatedAttributes,
            imageUpload: imageUploadResult,
          },
          HttpStatus.CREATED,
        );
      });
    } catch (error) {
      console.error('Error creating product with attributes:', error);

      // Handle validation errors with structured response
      if (
        error instanceof BadRequestException &&
        (error as any).validationDetails
      ) {
        const validationDetails = (error as any).validationDetails;

        return ResponseHelper.CreateResponse(
          error.message,
          {
            validationErrors: validationDetails,
            timestamp: new Date().toISOString(),
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Handle other BadRequestExceptions
      if (error instanceof BadRequestException) {
        return ResponseHelper.CreateResponse(
          error.message,
          null,
          HttpStatus.BAD_REQUEST,
        );
      }

      return ResponseHelper.CreateResponse(
        'Failed to create product',
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Retrieves a summary of product information including name, title, average rating,
   * formatted price, all associated color options from its items, and images.
   * @param productId The ID of the product to retrieve.
   * @returns A Promise that resolves to a ProductSummaryOutputDTO object.
   * @throws NotFoundException if the product is not found or is deleted.
   */
  async getProductSummary(
    userId: bigint | null,
    productId: bigint,
  ): Promise<ApiResponse<ProductSummaryOutputDTO>> {
    try {
      const product = await this.prisma.product.findFirst({
        where: {
          id: productId,
          is_deleted: false,
        },
        include: {
          model: true,
          productImages: true,
          currency: true,
          productReviews: true,
        },
      });

      if (!product) {
        throw new NotFoundException(
          new ApiResponse(HttpStatus.NOT_FOUND, 'Product not found', null),
        );
      }

      const viewershipCountResponse =
        await this.productAnalyticsService.getProductUniqueViewershipCount(
          productId,
        );
      const viewershipCount = viewershipCountResponse.data || 0;

      // 1. Calculate Average Rating
      const totalRatings = product.productReviews.reduce(
        (sum: number, review: any) => sum + review.rating,
        0,
      );

      const averageRating =
        product.productReviews.length > 0
          ? parseFloat(
              (totalRatings / product.productReviews.length).toFixed(1),
            )
          : 0;

      // 2. Determine Price with Currency Symbol
      const price = product?.sales_price.toFixed(2) || '0.00';

      // 3. Extract Unique Color Information
      // 4. Extract Image Information
      const images = product.productImages.map((img) => ({
        id: BigInt(img.id),
        product_id: BigInt(product.id),
        img_url: img.img_url,
        altText: img.alt_text || '',
        order: img.order,
      }));

      // Construct the final output.
      const summary: ProductSummaryOutputDTO = {
        id: product.id,
        name: product.name,
        title: product.title || product.name,
        description: product.description,
        currency_id: product.currency.id,
        averageRating: averageRating,
        sales_price: Number(price),
        symbol: product.currency?.curr || '$',
        images: images,
        viewerShipCount: viewershipCount,
        model: product.model,
      };

      return ResponseHelper.CreateResponse<ProductSummaryOutputDTO>(
        '',
        summary,
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        new ApiResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Failed to get product summary',
          error,
        ),
      );
    }
  }

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
    // Start with base filters from the query parser
    let finalWhere: any = {
      is_deleted: false,
      is_accessory: isAccessory,
      // Merge any additional where conditions from the query parser
      ...(where || {}),
    };

    let finalOrderBy: any = { ...order };

    // Handle custom category expression filters
    if (customCategoryExpression) {
      const tagName = CUSTOM_FILTER_TO_TAG[customCategoryExpression];
      if (tagName) {
        // Add tag filter to existing where conditions
        const tagFilter = {
          productTags: {
            some: {
              tags: {
                name: tagName,
                is_deleted: false,
              },
              is_deleted: false,
            },
          },
        };

        // If where already has AND conditions, merge them
        if (finalWhere.AND) {
          finalWhere.AND.push(tagFilter);
        } else {
          finalWhere = {
            ...finalWhere,
            AND: [tagFilter],
          };
        }
      }

      // Handle NEW_ARRIVAL special case
      if (customCategoryExpression === CustomFilter.NEW_ARRIVAL) {
        const newArrivalDays = 30; // or configurable
        const newArrivalFilter = {
          created_at: {
            gte: new Date(Date.now() - newArrivalDays * 24 * 60 * 60 * 1000),
          },
        };

        if (finalWhere.AND) {
          finalWhere.AND.push(newArrivalFilter);
        } else {
          finalWhere = {
            ...finalWhere,
            AND: [newArrivalFilter],
          };
        }

        finalOrderBy = { ...finalOrderBy, created_at: 'desc' };
      }
    }

    // Build comprehensive select options
    const selectOptions: any = {
      id: true,
      sku: true,
      name: true,
      title: true,
      product_slug: true,
      sales_price: true,
      description: true,
      accessory_image: true,
      year_of_production: true,
      created_at: true,
      updated_at: true,

      // Include any custom select fields from query parser
      ...select,

      // Relations
      brand: {
        select: {
          id: true,
          title: true,
          image_url: true,
        },
      },
      category: {
        select: {
          id: true,
          title: true,
          image_url: true,
        },
      },
      model: {
        select: {
          id: true,
          title: true,
          image_url: true,
        },
      },
      productGender: {
        select: {
          id: true,
          title: true,
          image_url: true,
        },
      },
      currency: {
        select: {
          id: true,
          curr: true,
          exchangeRate: true,
        },
      },
      tax: {
        select: {
          id: true,
          taxRate: true,
          description: true,
        },
      },
      productTags: {
        select: {
          id: true,
          tags: {
            select: {
              id: true,
              key: true,
              title: true,
            },
          },
        },
        where: {
          is_deleted: false,
          tags: {
            is_deleted: false,
          },
        },
      },
      productImages: {
        select: {
          id: true,
          img_url: true,
          image_type: true,
        },
        where: {
          is_deleted: false,
        },
        take: 5,
      },
      productReviews: {
        select: {
          id: true,
          ratings: true,
          review: true,
          reviewedBy: true,
        },
        where: {
          is_deleted: false,
        },
      },

      // EAV attributes
      attributeValues: {
        select: {
          id: true,
          string_value: true,
          number_value: true,
          boolean_value: true,
          date_value: true,
          lookup_name: true,
          lookup_id: true,
          attributeCategoryMapping: {
            select: {
              id: true,
              data_type: true,
              attribute: {
                select: {
                  id: true,
                  name: true,
                  display_name: true,
                  unit: true,
                },
              },
              attributeCategory: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        where: {
          is_deleted: false,
          attributeCategoryMapping: {
            is_deleted: false,
            attribute: {
              is_deleted: false,
            },
            attributeCategory: {
              is_deleted: false,
            },
          },
        },
      },

      // Favorites
      ...(userId && {
        productFavorite: {
          where: {
            user_id: userId,
            is_deleted: false,
          },
          select: {
            id: true,
          },
        },
      }),
    };

    const response = await this.getAllPagedData(
      pageNumber,
      pageSize,
      finalOrderBy,
      finalWhere,
      selectOptions,
    );

    if (!response.data || response.data?.length === 0) {
      throw new NotFoundException(Constants.NO_DATA_FOUND_FILTER);
    }

    // Transform the results with enhanced data structure
    const result = response.data.map((product: any) => {
      // Get primary image or first available image
      const primaryImage =
        product.productImages?.find((img: any) => img.is_primary) ||
        product.productImages?.[0];

      // Transform EAV attributes into a more usable format
      const dynamicAttributes: Record<string, any> = {};
      if (product.attributeValues) {
        product.attributeValues.forEach((attr: any) => {
          const attributeName = attr.attributeCategoryMapping.attribute.name;
          const dataType = attr.attributeCategoryMapping.data_type;

          let value = null;
          switch (dataType) {
            case 'string':
              value = attr.string_value;
              break;
            case 'number':
              value = attr.number_value;
              break;
            case 'boolean':
              value = attr.boolean_value;
              break;
            case 'date':
              value = attr.date_value;
              break;
            case 'lookup':
              value = attr.lookup_id;
              break;
          }

          if (value !== null) {
            dynamicAttributes[attributeName] = {
              value,
              displayName: attr.attributeCategoryMapping.attribute.display_name,
              unit: attr.attributeCategoryMapping.attribute.unit,
              dataType,
            };
          }
        });
      }

      return {
        // Core product information
        productId: product.id, // Encode for public use
        slug: product.product_slug,
        name: product.name,
        title: product.title,
        description: product.description,
        sku: product.sku,
        yearOfProduction: product.year_of_production,

        // Pricing and currency
        price: product.sales_price?.toFixed(2),
        currency: product.currency?.curr,

        // Images
        imageUrl: primaryImage?.image_url || product.accessory_image,
        images:
          product.productImages?.map((img: any) => ({
            id: img.id,
            url: img.image_url,
            type: img.image_type,
          })) || [],

        // Brand and category information
        brand: product.brand
          ? {
              id: product.brand.id,
              name: product.brand.name,
            }
          : null,

        category: product.category
          ? {
              id: product.category.id,
              name: product.category.name,
            }
          : null,

        model: product.model
          ? {
              id: product.model.id,
              name: product.model.name,
            }
          : null,

        // Tags
        tags:
          product.productTags?.map((pt: any) => ({
            id: pt.tags.id,
            key: pt.tags.key,
            title: pt.tags.title,
          })) || [],

        // Dynamic EAV attributes
        attributes: dynamicAttributes,

        // User-specific data
        isFavorite: userId ? !!product.productFavorite?.[0]?.id : null,

        // Metadata
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      };
    });

    const meta = response.getMeta ? response.getMeta() : {};
    return ResponseHelper.CreateResponse<any[]>('', result, HttpStatus.OK, {
      totalCount: (meta as any).totalCount ?? 0,
      pageNumber: (meta as any).pageNumber ?? 1,
      pageSize: (meta as any).pageSize ?? 0,
      numberOfTotalPages: (meta as any).numberOfTotalPages ?? 1,
    });
  }

  async getProductListing(
    pageNumber: number,
    pageSize: number,
    userId?: bigint,
    order?: object,
    where?: object,
  ): Promise<ApiResponse<any[]>> {
    // Base filters
    const finalWhere: any = {
      is_accessory: false,
      is_deleted: false,
      ...where,
    };

    // Select options (fetching joined data)
    // Fetch paged data
    const skip = (pageNumber - 1) * pageSize;
    const [products, totalCount] = await Promise.all([
      this.prisma.product.findMany({
        where: finalWhere,
        select: {
          id: true,
          name: true,
          title: true,
          description: true,
          year_of_production: true,
          product_slug: true,
          sales_price: true,
          currency: {
            select: {
              curr: true,
            },
          },
          productImages: {
            select: {
              img_url: true,
              alt_text: true,
              order: true,
            },
            where: {
              is_deleted: false,
            },
            orderBy: {
              order: 'asc' as const,
            },
            take: 1,
          },
          brand: {
            select: {
              title: true,
            },
          },
          category: {
            select: {
              title: true,
            },
          },
          model: {
            select: {
              title: true,
            },
          },
          productFavorite: userId
            ? {
                where: {
                  user_id: userId,
                  is_deleted: false,
                },
                select: {
                  id: true,
                },
              }
            : undefined,
        },
        skip,
        take: pageSize,
        orderBy: order || { created_at: 'desc' },
      }),
      this.prisma.product.count({
        where: finalWhere,
      }),
    ]);

    if (!products || products.length === 0) {
      throw new NotFoundException(Constants.NO_DATA_FOUND_FILTER);
    }

    // Map into expected response
    const mappedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      title: p.title,
      slug: p.product_slug,
      price: p.sales_price.toFixed(2),
      symb: p.currency?.curr || '$',
      image_url: p.productImages[0]?.img_url,
      isFavorite: userId
        ? p.productFavorite && p.productFavorite.length > 0
        : null,
      brand: p.brand?.title,
      category: p.category?.title,
      model: p.model?.title,
      yearOfProduction: p.year_of_production,
    }));

    // Return paginated response
    const numberOfTotalPages = Math.ceil(totalCount / pageSize);
    return ResponseHelper.CreateResponse<any[]>(
      '',
      mappedProducts,
      HttpStatus.OK,
      {
        totalCount,
        pageNumber,
        pageSize,
        numberOfTotalPages,
      },
    );

    // Deleted duplicate response handling code
  }

  async calculateEstimatedPayoutAndCommission(
    salesPrice: number,
    calculate: 'commission' | 'payout',
  ): Promise<number> {
    try {
      // Ensure input is number
      const numSalesPrice = Number(salesPrice);

      // Get commission % from global config
      const config = await this.prisma.globalConfiguration.findUnique({
        where: { key: 'PLATFORM_COMMISSION' },
      });

      if (!config) {
        throw new InternalServerErrorException(
          'Platform commission config not found',
        );
      }

      const commissionPercentage = Number(config.value);
      const commissionFee = (numSalesPrice * commissionPercentage) / 100;

      if (calculate === 'commission') {
        return commissionFee;
      }

      // Default: payout
      return numSalesPrice - commissionFee;
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error occurred while calculating estimated payout',
        error,
      );
    }
  }
  async getAllPagedData(
    pageNumber: number,
    pageSize: number,
    order?: object,
    where?: object,
    select?: object,
    include?: object,
  ): Promise<ApiResponse<any>> {
    const { data, totalCount } = await this.productRepository.findManyPaginated(
      pageNumber,
      pageSize,
      where,
      select,
      order,
      include,
    );
    return ResponseHelper.CreateResponse<any>(
      Constants.DATA_SUCCESS,
      data,
      HttpStatus.OK,
      {
        pageNumber,
        pageSize,
        totalCount,
        numberOfTotalPages: Math.ceil(totalCount / pageSize),
      },
    );
  }

  async checkIfStockAvailable(
    productId: bigint,
    quantity: number,
  ): Promise<boolean> {
    const result = await this.prisma.product.findFirst({
      where: {
        id: productId,
        quantity: {
          gte: quantity,
        },
      },
      select: {
        quantity: true,
      },
    });
    if (result && result.quantity > 0) return true;
    return false;
  }
  /**
   * This method prepares the order summary for the selected product(s) on the cart. Basically it just calculate total price, discount, taxes where applicable and shipping cost if any.
   * @param summary The request dto object which contains selected productId, itemId and the quantity
   * @returns Promise<ApiResponse<OrderSummaryDTO>>
   */
  async getOrderSummary(
    cartItems: OrderSummaryRequestDTO[],
  ): Promise<ApiResponse<OrderSummaryDTO>> {
    if (!cartItems || cartItems?.length === 0)
      throw new BadRequestException(
        "Cart is empty. Summary can't be calculated",
      );

    const uniqueProductIds = cartItems.map((i) => i.productId);
    const itemsInfo = await this.productRepository.getProductWithTax(
      uniqueProductIds,
    );

    if (itemsInfo.length !== uniqueProductIds.length) {
      throw new BadRequestException('One or more products not found.');
    }

    const itemMap = new Map(itemsInfo.map((item) => [item.id, item]));
    const cartItemMap = new Map(
      cartItems.map((item) => [BigInt(item.productId), item]),
    );

    // TODO: Later will move inside a stored procedure probably
    // Inventory Check
    let inventoryValidation = [];
    for (const item of itemsInfo) {
      const requestedItem = cartItemMap.get(item.id);
      if (requestedItem!.quantity > item.quantity)
        inventoryValidation.push(
          `Only stocks of ${item.quantity} is available for ${item.id}`,
        );
    }
    if (inventoryValidation.length) {
      throw new BadRequestException(inventoryValidation);
    }

    let totalSubtotal = 0;
    let totalDiscount = 0;
    const taxMap = new Map<string, number>();
    const summaryItems: OrderSummaryProductDTO[] = [];

    for (const cartItem of cartItems) {
      const item = itemMap.get(cartItem.productId)!;
      const currency = item.currency;
      const currencyRate = currency?.exchangeRate?.toFixed(2) || 1;
      const price = item.price.toFixed(2) * currencyRate;
      const discount = item.discount.toFixed(2) * currencyRate;

      const taxRate = item.tax?.taxRate.toFixed(2) || 0 * currencyRate;
      const taxName = item.tax?.description || 'N/A';

      const itemSubtotal = (price - discount) * cartItem.quantity;
      const itemTaxAmount = itemSubtotal * taxRate;
      const itemTotal = itemSubtotal + itemTaxAmount;

      totalSubtotal += itemSubtotal * currencyRate;
      totalDiscount += discount * cartItem.quantity;

      const currentTaxAmount = taxMap.get(taxName) || 0;
      taxMap.set(taxName, currentTaxAmount + itemTaxAmount);

      summaryItems.push({
        symb: currency?.curr || '$',
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        sales_price: price,
        discount: discount,
        subtotal: itemSubtotal,
        taxAmount: itemTaxAmount,
        taxName: taxName,
        total: itemTotal,
      });
    }

    const taxSummary: TaxLineDTO[] = Array.from(
      taxMap,
      ([taxName, amount]) => ({
        taxName: taxName,
        amount: amount,
      }),
    );

    const totalTax = taxSummary.reduce((sum, tax) => sum + tax.amount, 0);
    const grandTotal = totalSubtotal + totalTax;

    return ResponseHelper.CreateResponse<OrderSummaryDTO>(
      '',
      {
        products: summaryItems,
        subtotal: totalSubtotal,
        totalDiscount: totalDiscount,
        taxSummary: taxSummary,
        grandTotal: grandTotal,
      },
      HttpStatus.OK,
    );
  }
}
