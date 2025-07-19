import { GetAllQueryDTO } from "@DTO/get-all-query.dto";
import { UserId } from "@Decorators/userId.decorator";
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ProductService } from "@Services/product.service";
import { FavoriteService } from "@Services/favorite.service";
import { AddToCartRequestDTO } from "@DTO/add.to.cart.request.dto";
import { CartService } from "@Services/cart.service";
import { RemoveCartItemRequestDTO } from "@DTO/remove.cart.request.dto";
import { ProductType } from "@Common/enums/product.type.enum";
import { JwtAuthGuard } from "@Auth/jwt-auth.guard";

@Controller("product")
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly favoriteService: FavoriteService,
    private readonly cartService: CartService
  ) {}

  /**
   *
   * @param query This is the query filter provided by the client-side. Details are available in the Readme.MD
   * @param productType This tells us whether the queried param is product or accessory. Always pass p for poduct and a for accessory
   * @returns
   */
  @Get(":p")
  async getAll(
    @Query() query: GetAllQueryDTO,
    @Param("p") productType: ProductType
  ) {
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
      customCategoryExpression
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post("favorite/:productId/:itemId")
  async favorite(
    @UserId() userId: bigint,
    @Param("productId") productId: bigint,
    @Param("itemId") itemId: bigint
  ) {
    return this.favoriteService.markProductAsFavorite(
      userId,
      productId,
      itemId
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put("favorite/:productId/:itemId")
  async UnFavorite(
    @UserId() userId: bigint,
    @Param("productId") productId: bigint,
    @Param("itemId") itemId: bigint
  ) {
    return this.favoriteService.markProductAsUnFavorite(
      userId,
      productId,
      itemId
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post("cart")
  async addToCart(@UserId() userId: bigint, @Body() cart: AddToCartRequestDTO) {
    // Adding userId
    cart.userId = userId;
    return this.cartService.addProductToCart(cart);
  }

  @UseGuards(JwtAuthGuard)
  @Put("cart")
  async removeFromCart(
    @UserId() userId: bigint,
    @Body() cart: RemoveCartItemRequestDTO
  ) {
    // Adding userId
    cart.userId = userId;
    return this.cartService.removeFromCart(cart);
  }
}
