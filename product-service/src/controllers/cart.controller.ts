import { JwtAuthGuard } from '@Auth/jwt-auth.guard';
import { GetAllQueryDTO } from '@DTO/get-all-query.dto';
import { UserId } from '@Auth/decorators/userId.decorator';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CartService } from '@Services/cart.service';
import { AddToCartRequestDTO } from '@DTO/add-to-cart-request.dto';
import { RemoveCartItemRequestDTO } from '@DTO/remove-cart-request.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  async addToCart(@UserId() userId: bigint, @Body() cart: AddToCartRequestDTO) {
    // Adding userId
    cart.userId = userId;
    return this.cartService.addProductToCart(cart);
  }

  // TODO: Need to Make it Delete
  @Post('remove')
  @UseGuards(JwtAuthGuard)
  async removeFromCart(
    @UserId() userId: bigint,
    @Body() cart: RemoveCartItemRequestDTO[],
  ) {
    return this.cartService.removeFromCart(userId, cart);
  }
}
