import { JwtAuthGuard } from '@Auth/jwt-auth.guard';
import { GetAllQueryDTO } from '@DTO/get-all-query.dto';
import { UserId } from '@Helper/decorators/userId.decorator';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CartService } from '@Services/cart.service';

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
}
