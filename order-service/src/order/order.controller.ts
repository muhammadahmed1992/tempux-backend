import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { OrderResponseDto, OrderListingDto } from './dtos/order-response.dto';
import ApiResponse from '../common/helper/api-response';
import ResponseHelper from '../common/helper/response-helper';
import { AuthUserGuard } from '../auth/guards/auth-user-guard';
import { UserId } from '../auth/decorators/userId.decorator';
import { ParseQueryPipe } from '../common/pipes/parse-query.pipe';

@Controller('orders')
@UseGuards(AuthUserGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @UserId() userId: bigint,
  ): Promise<ApiResponse<OrderResponseDto>> {
    const order = await this.orderService.createOrder(createOrderDto, userId);
    return ResponseHelper.CreateResponse<OrderResponseDto>(
      'Order created successfully',
      order,
      HttpStatus.CREATED,
    );
  }

  @Get()
  async getOrders(
    @UserId() userId: bigint,
    @Query('page', ParseQueryPipe) page: number = 1,
    @Query('pageSize', ParseQueryPipe) pageSize: number = 10,
  ): Promise<ApiResponse<{ data: OrderListingDto[]; totalCount: number }>> {
    const result = await this.orderService.getOrdersByBuyerId(
      userId,
      page,
      pageSize,
    );
    return ResponseHelper.CreateResponse(
      'Orders retrieved successfully',
      result,
      HttpStatus.OK,
    );
  }

  @Get(':id')
  async getOrder(
    @Param('id') orderId: string,
  ): Promise<ApiResponse<OrderResponseDto>> {
    const order = await this.orderService.getOrder(BigInt(orderId));
    return ResponseHelper.CreateResponse<OrderResponseDto>(
      'Order retrieved successfully',
      order,
      HttpStatus.OK,
    );
  }

  @Put(':id/status')
  async updateOrderStatus(
    @Param('id') orderId: string,
    @Body('status') status: string,
    @UserId() userId: bigint,
  ): Promise<ApiResponse<OrderResponseDto>> {
    const order = await this.orderService.updateOrderStatus(
      BigInt(orderId),
      status,
      userId,
    );
    return ResponseHelper.CreateResponse<OrderResponseDto>(
      'Order status updated successfully',
      order,
      HttpStatus.OK,
    );
  }
}

