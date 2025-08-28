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
import { ProductService } from '@Product/product.service';
import { FavoriteService } from '@Favorite/favorite.service';
import { ProductType } from '@Common/enums/product.type.enum';
import Utils from '@Common/utils';
import Constants from '@Helper/constants';
import ResponseHelper from '@Helper/response-helper';
import { ProductSummaryOutputDTO } from '@DTO/product-summary.info.dto';
import ApiResponse from '@Helper/api-response';
import { ProductAnalyticsService } from '@ProductAnalytics/product-analytics.service';
import { OptionalUser } from '@Auth/decorators/optional-userId.decorator';
import { ParseProductIdPipe } from '@Pipes/parse-product-id.pipe';
import { OrderSummaryRequestDTO } from '@DTO/order-summary-request.dto';
import { ProductItemService } from '@ProductItem/product-item.service';
import { HeaderAuthGuard } from '@Auth/guards/auth-user-guard';

@Controller()
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly favoriteService: FavoriteService,
    private readonly productAnalyticsService: ProductAnalyticsService,
    private readonly productItemSerice: ProductItemService,
  ) {}

  /**
   *
   * @param query This is the query filter provided by the client-side. Details are available in the Readme.MD
   * @param productType This tells us whether the queried param is product or accessory. Always pass p for poduct and a for accessory
   * @returns ProductDetails
   */
  @Get('/list/:p')
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
    console.log(userId);
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

  @Get('/detailed-list-chrono')
  async getList(
    @Query() query: GetAllQueryDTO,
    @OptionalUser() userId?: bigint,
  ) {
    const { page, pageSize, orderBy, where } = query;
    return this.productService.getProductListing(
      page,
      pageSize,
      userId,
      orderBy,
      where,
    );
  }

  /**
   *
   * @param productId This is the productId provided by the client-side.
   * @returns Summary Information of a ApiResponse<ProductSummaryOutput>.
   */
  // Example route: GET /products/123/summary
  @Get(':id/summary')
  async getProductSummary(
    @Param('id', ParseProductIdPipe) id: bigint,
    @OptionalUser() userId: bigint | null,
  ): Promise<ApiResponse<ProductSummaryOutputDTO>> {
    return this.productService.getProductSummary(userId, id);
  }

  /**
   *
   * @param productId This is the productId provided by the client-side.
   * @param sku This is the item specific information which needs to be provided by client-side
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

  @Post()
  @UseGuards(HeaderAuthGuard)
  async product(@UserId() userId: bigint) {
    await this.productService.createProduct(userId);
  }

  @Post('favorite/:id/:itemId')
  @UseGuards(HeaderAuthGuard)
  async favorite(
    @UserId() userId: bigint,
    @Param('id', ParseProductIdPipe) id: bigint,
    @Param('itemId') itemId: bigint,
    @Body('flag') flag: boolean,
  ) {
    return this.favoriteService.markProductAsFavorite(userId, id, itemId, flag);
  }

  @Post('/analytics')
  @UseGuards(HeaderAuthGuard)
  async createViewerShipAnalytics(
    @UserId() userId: bigint,
    @Body()
    analytics: { productId: bigint; itemId: bigint },
  ) {
    return this.productAnalyticsService.recordProductView(
      userId,
      analytics.productId,
      analytics.itemId,
      userId,
    );
  }

  @Post('/order-summary')
  @UseGuards(HeaderAuthGuard)
  async fetchOrderSummary(@Body() summary: OrderSummaryRequestDTO[]) {
    return this.productItemSerice.getOrderSummary(summary);
  }

  /**
   * @returns Get recommended watches for user based on the viewed
   * 1.Brand (1/3rd of the total)
   * 2.Category (half of the remaining limit)
   * 3.Price (20% < pricerange > 20%)
   * 4.Limit 5 watches to display
   */
  @Get('/recommendations')
  @UseGuards(HeaderAuthGuard)
  async getUserRecommendations(@UserId() userId: bigint) {
    return this.productAnalyticsService.getUserRecommendedWatches(userId);
  }
}
