import { GetAllQueryDTO } from '@DTO/get-all-query.dto';
import { UserId } from '@Auth/decorators/userId.decorator';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartRequestDTO } from '@DTO/add-to-cart-request.dto';
import { RemoveCartItemRequestDTO } from '@DTO/remove-cart-request.dto';
import { HeaderAuthGuard } from '@Auth/guards/auth-user-guard';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(HeaderAuthGuard)
  @Get()
  async getAll(@UserId() userId: bigint, @Query() query: GetAllQueryDTO) {
    const { page, pageSize, orderBy, where, select } = query;
    return this.cartService.fetchCartInformation(
      userId,
      page,
      pageSize,
      orderBy,
      where,
      select,
    );
  }

  @Post()
  @UseGuards(HeaderAuthGuard)
  async addToCart(@UserId() userId: bigint, @Body() cart: AddToCartRequestDTO) {
    // Adding userId
    cart.userId = userId;
    return this.cartService.addProductToCart(cart);
  }

  // TODO: Need to Make it Delete
  @Post('remove')
  @UseGuards(HeaderAuthGuard)
  async removeFromCart(
    @UserId() userId: bigint,
    @Body() cart: RemoveCartItemRequestDTO[],
  ) {
    return this.cartService.removeFromCart(userId, cart);
  }
}
