import { GetAllQueryDTO } from '@DTO/get-all-query.dto';
import { UserId } from '@Auth/decorators/userId.decorator';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from '@Services/product.service';
import { FavoriteService } from '@Services/favorite.service';
import { AddToCartRequestDTO } from '@DTO/add-to-cart-request.dto';
import { CartService } from '@Services/cart.service';
import { RemoveCartItemRequestDTO } from '@DTO/remove-cart-request.dto';
import { ProductType } from '@Common/enums/product.type.enum';
import { JwtAuthGuard } from '@Auth/jwt-auth.guard';
import Utils from '@Common/utils';
import Constants from '@Helper/constants';
import ResponseHelper from '@Helper/response-helper';
import { ProductSummaryOutputDTO } from '@DTO/product-summary.info.dto';
import ApiResponse from '@Helper/api-response';
import { ProductAnalyticsService } from '@Services/product-analytics.service';
import { OptionalJwtAuthGuard } from '@Auth/optional.jwt-auth.guard';
import { OptionalUser } from '@Auth/decorators/optional-userId.decorator';
import { ParseProductIdPipe } from '@Pipes/parse-product-id.pipe';
import { ParseAddToCartPipe } from '@Pipes/parse-add-to-cart-dto.pipe';
import { ParseRemoveCartItemPipe } from '@Pipes/parse-remove-to-cart-dto.pipe';
import { ParseAddToAnalyticsPipe } from '@Common/pipes/parse-add-to-analytics-dto.pipe';
import { OrderSummaryRequestDTO } from '@DTO/order-summary-request.dto';
import { ParseOrderSummaryPipe } from '@Common/pipes/parse-order-summary-request-dto.pipe';

@Controller()
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly favoriteService: FavoriteService,
    private readonly cartService: CartService,
    private readonly productAnalyticsService: ProductAnalyticsService,
  ) {}

  /**
   *
   * @param query This is the query filter provided by the client-side. Details are available in the Readme.MD
   * @param productType This tells us whether the queried param is product or accessory. Always pass p for poduct and a for accessory
   * @returns ProductDetails
   */
  @Get('/list/:p')
  @UseGuards(OptionalJwtAuthGuard)
  async getAll(
    @Query() query: GetAllQueryDTO,
    @Param('p') productType: ProductType,
    @OptionalUser() userId?: bigint,
  ) {
    if (!Utils.IsEnumValue(ProductType, productType))
      throw new BadRequestException(Constants.INVALID_PRODUCT_PARAMETER);
    const pType = ProductType.Accessory === productType;
    const { page, pageSize, orderBy, where, select, customCategoryExpression } =
      query;
    return this.productService.getProductListingFiltered(
      page,
      pageSize,
      pType,
      userId,
      orderBy,
      where,
      select,
      customCategoryExpression,
    );
  }

  /**
   *
   * @param productId This is the productId provided by the client-side.
   * @returns Summary Information of a ApiResponse<ProductSummaryOutput>.
   */
  // Example route: GET /products/123/summary
  @Get(':id/summary')
  @UseGuards(OptionalJwtAuthGuard)
  async getProductSummary(
    @Param('id', ParseProductIdPipe) id: bigint,
    @OptionalUser() userId: bigint | null,
  ): Promise<ApiResponse<ProductSummaryOutputDTO>> {
    return this.productService.getProductSummary(userId, id);
  }

  /**
   *
   * @param productId This is the productId provided by the client-side.
   * @param sku This is the variant specific information which needs to be provided by client-side
   * @returns Detailed Information of a product.
   */
  @Get(':id/details')
  async getProductInformation(
    @Param('id', ParseProductIdPipe) id: bigint,
    @Query('sku') sku: string,
  ) {
    return ResponseHelper.CreateResponse<any>(
      '',
      {
        basicInfo: {
          listingCode: 'N55CC1',
          brand: 'Rolex',
          model: 'Submariner Date',
          referenceNumber: '116610N (Submariner Ceramic Bezel Dark)',

          braceletMaterial: 'Steel',
          yearOfProduction: 2025,
          condition:
            'Used (Very good) The item shows minor sign of wear, such as small, intangible scratches',
          scopeOfDelivery: 'Orignal box, original papers',
          gender: `Men's watch/uni sex`,
          location: 'California, USA',
          price: '$122.54 (=$122.54)',
          availability: 'In stock',
          bracelet_strap: 'N/A',
          bracelet_color: 'Green',
          clasp: 'Fold clasp',
          clasp_material: 'Steel',
        },
        caliber: {
          movement: 'Automatic',
          caliber_movement: '3135',
          base_caliber: 'cal. 3135',
          power_reserve: '48 h',
          no_of_jewels: 31,
          case: '',
          caseMaterial: 'Steel',
          case_diameter: `48 mm`,
          water_resistance: '30 ATM',
          bezel_material: 'Ceramic',
          crystal: 'Sapphire  crystal',
          dial: 'black',
          dial_numerals: 'no numerals',
        },
        functions: {},
        date: '2025-01-01',
      },
      HttpStatus.OK,
    );
  }

  @Post('favorite/:id/:itemId')
  @UseGuards(JwtAuthGuard)
  async favorite(
    @UserId() userId: bigint,
    @Param('id', ParseProductIdPipe) id: bigint,
    @Param('itemId') itemId: bigint,
    @Body('flag') flag: boolean,
  ) {
    return this.favoriteService.markProductAsFavorite(userId, id, itemId, flag);
  }

  @Post('cart')
  @UseGuards(JwtAuthGuard)
  async addToCart(
    @UserId() userId: bigint,
    @Body(ParseAddToCartPipe) cart: AddToCartRequestDTO,
  ) {
    // Adding userId
    cart.userId = userId;
    return this.cartService.addProductToCart(cart);
  }

  // TODO: Need to Make it Delete
  @Post('cart/remove')
  @UseGuards(JwtAuthGuard)
  async removeFromCart(
    @UserId() userId: bigint,
    @Body(ParseRemoveCartItemPipe) cart: RemoveCartItemRequestDTO[],
  ) {
    return this.cartService.removeFromCart(userId, cart);
  }

  @Post('/analytics')
  @UseGuards(JwtAuthGuard)
  async createViewerShipAnalytics(
    @UserId() userId: bigint,
    @Body(ParseAddToAnalyticsPipe)
    analytics: { productId: bigint; product_variant_Id: bigint },
  ) {
    return this.productAnalyticsService.recordProductView(
      userId,
      analytics.productId,
      analytics.product_variant_Id,
      userId,
    );
  }

  @Get('/order-summary')
  @UseGuards(JwtAuthGuard)
  async fetchOrderSummary(
    @Body(ParseOrderSummaryPipe) summary: OrderSummaryRequestDTO[],
  ) {}
}
