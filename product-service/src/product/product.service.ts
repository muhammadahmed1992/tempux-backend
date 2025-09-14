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
import { CreateProductDto } from '@DTO/product.dto';
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
    symbol: string;
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
    private readonly productRepository: ProductRepository,
    private readonly productAnalyticsService: ProductAnalyticsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly slugService: SlugService,
    private readonly prisma: PrismaService,
    private readonly productValidationService: ProductValidationService,
    private readonly productAttributeService: ProductAttributesService,
  ) {}

  async createProduct(dto: CreateProductDto, userId: bigint) {
    try {
      const productInfo = dto.product;

      return this.prisma.$transaction(async (tx) => {
        // Batch validate all at once -  optimized batch operations internally
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

        // Generate slug and other product info
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

        // Batch calculate commission and payout in parallel
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

        // Batch attribute update
        const updatedAttributes =
          await this.productAttributeService.updateProductAttributes(
            tx,
            newProduct.id,
            dto.attributes,
            userId,
          );

        console.log('Updated attributes:', updatedAttributes);

        // Emit product created event (non-blocking)
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

      // Handle general errors
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
    let finalWhere: any = {
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

    // Filter logic using tags
    if (customCategoryExpression) {
      const tagName = CUSTOM_FILTER_TO_TAG[customCategoryExpression];
      if (tagName) {
        // Filter products that have the tag
        finalWhere.product = {
          ...finalWhere.product,
          productTags: {
            some: {
              tags: {
                name: tagName,
              },
            },
          },
        };
      }
      // For NEW_ARRIVAL, we may also want to filter by created_at (optional)
      if (customCategoryExpression === CustomFilter.NEW_ARRIVAL) {
        const newArrivalDays = 30; // or configurable
        finalWhere.product.created_at = {
          gte: new Date(Date.now() - newArrivalDays * 24 * 60 * 60 * 1000),
        };
        finalOrderBy = { ...finalOrderBy, created_at: 'desc' };
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
          ...select,
          productTags: {
            select: {
              tags: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      },
      ...(userId && {
        productItemFavorite: {
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
          curr: true,
        },
      },
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
    const result = response.data.map(
      (pv: {
        id: bigint;
        base_image_url: string;
        product: {
          id: bigint;
          name: string;
          title: string;
          product_slug: string;
          productTags: any[];
        };
        price: number;
        description: string;
        title: string;
        currency: { curr: string };
        productItemFavorite: any;
      }) => ({
        itemId: pv.id,
        productId: pv.product.id,
        slug: pv.product.product_slug,
        name: pv.product.name,
        title: pv.product.title,
        symb: pv.currency.curr,
        image_url: pv.base_image_url,
        price: pv.price.toFixed(2),
        isFavorite: userId ? !!pv.productItemFavorite?.[0]?.id : null,
        tags: pv.product?.productTags?.map((p) => p.tags),
      }),
    );

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
}
