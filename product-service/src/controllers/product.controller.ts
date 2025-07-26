import { GetAllQueryDTO } from '@DTO/get-all-query.dto';
import { UserId } from '@Decorators/userId.decorator';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from '@Services/product.service';
import { FavoriteService } from '@Services/favorite.service';
import { AddToCartRequestDTO } from '@DTO/add.to.cart.request.dto';
import { CartService } from '@Services/cart.service';
import { RemoveCartItemRequestDTO } from '@DTO/remove.cart.request.dto';
import { ProductType } from '@Common/enums/product.type.enum';
import { JwtAuthGuard } from '@Auth/jwt-auth.guard';
import Utils from '@Common/utils';
import Constants from '@Helper/constants';

@Controller('product')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly favoriteService: FavoriteService,
    private readonly cartService: CartService,
  ) {}

  /**
   *
   * @param query This is the query filter provided by the client-side. Details are available in the Readme.MD
   * @param productType This tells us whether the queried param is product or accessory. Always pass p for poduct and a for accessory
   * @returns
   */
  @Get(':p')
  async getAll(
    @Query() query: GetAllQueryDTO,
    @Param('p') productType: ProductType,
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
      orderBy,
      where,
      select,
      customCategoryExpression,
    );
  }

  /**
   *
   * @param productId This is the productId provided by the client-side.
   * @returns Detailed Information of a product.
   */
  @Get(':productId/details')
  async getProductInformation(@Param('productId') productId: number) {
    return {
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
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('favorite/:productId/:itemId')
  async favorite(
    @UserId() userId: bigint,
    @Param('productId') productId: bigint,
    @Param('itemId') itemId: bigint,
  ) {
    return this.favoriteService.markProductAsFavorite(
      userId,
      productId,
      itemId,
    );
  }

  // TODO: Need to Make it put
  @UseGuards(JwtAuthGuard)
  @Post('favorite/:productId/:itemId')
  async UnFavorite(
    @UserId() userId: bigint,
    @Param('productId') productId: bigint,
    @Param('itemId') itemId: bigint,
  ) {
    return this.favoriteService.markProductAsUnFavorite(
      userId,
      productId,
      itemId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('cart')
  async addToCart(@UserId() userId: bigint, @Body() cart: AddToCartRequestDTO) {
    // Adding userId
    cart.userId = userId;
    return this.cartService.addProductToCart(cart);
  }

  // TODO: Need to Make it put
  @UseGuards(JwtAuthGuard)
  @Post('cart')
  async removeFromCart(
    @UserId() userId: bigint,
    @Body() cart: RemoveCartItemRequestDTO,
  ) {
    // Adding userId
    cart.userId = userId;
    return this.cartService.removeFromCart(cart);
  }
}
