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
import { OrderQueryDto } from './dtos/order-query.dto';
import { OrderResponseDto, OrderListingDto } from './dtos/order-response.dto';
import {
  ShippingEstimateDto,
  ShippingEstimateResponse,
} from './dtos/shipping-estimate.dto';
import ApiResponse from '../common/helper/api-response';
import ResponseHelper from '../common/helper/response-helper';
import { HeaderAuthGuard } from '../auth/guards/auth-user-guard';
import { UserId } from '../auth/decorators/userId.decorator';
import { AppLoggerService } from '../common/logging';

@Controller('orders')
@UseGuards(HeaderAuthGuard)
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly logger: AppLoggerService,
  ) {}

  @Post()
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @UserId() userId: bigint,
  ): Promise<ApiResponse<OrderResponseDto>> {
    this.logger.info({
      message: 'Order creation started',
      context: {
        operation: 'create_order',
        userId: userId.toString(),
      },
    });

    const order = await this.orderService.createOrder(createOrderDto, userId);

    this.logger.info({
      message: 'Order created successfully',
      context: {
        operation: 'create_order',
        userId: userId.toString(),
        orderId: order.id,
      },
    });

    return ResponseHelper.CreateResponse<OrderResponseDto>(
      'Order created successfully',
      order,
      HttpStatus.CREATED,
    );
  }

  @Get()
  async getOrders(
    @Query() query: OrderQueryDto,
    @UserId() userId: bigint,
  ): Promise<ApiResponse<{ data: OrderListingDto[]; totalCount: number }>> {
    this.logger.info({
      message: 'Fetching orders for user',
      context: {
        operation: 'get_orders',
        userId: userId.toString(),
        page: query.page,
        pageSize: query.pageSize,
      },
    });

    const result = await this.orderService.getOrdersByBuyerId(
      userId,
      query.page || 1,
      query.pageSize || 10,
    );

    this.logger.info({
      message: 'Orders retrieved successfully',
      context: {
        operation: 'get_orders',
        userId: userId.toString(),
        totalCount: result.totalCount,
        page: query.page,
        pageSize: query.pageSize,
      },
    });

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
    this.logger.info({
      message: 'Fetching order by ID',
      context: {
        operation: 'get_order',
        orderId,
      },
    });

    const order = await this.orderService.getOrder(BigInt(orderId));

    this.logger.info({
      message: 'Order retrieved successfully',
      context: {
        operation: 'get_order',
        orderId,
        buyerId: order.buyerId,
      },
    });

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
    this.logger.info({
      message: 'Updating order status',
      context: {
        operation: 'update_order_status',
        orderId,
        userId: userId.toString(),
        newStatus: status,
      },
    });

    const order = await this.orderService.updateOrderStatus(
      BigInt(orderId),
      status,
      userId,
    );

    this.logger.info({
      message: 'Order status updated successfully',
      context: {
        operation: 'update_order_status',
        orderId,
        userId: userId.toString(),
        newStatus: status,
        previousStatus: order.orderStatus,
      },
    });

    return ResponseHelper.CreateResponse<OrderResponseDto>(
      'Order status updated successfully',
      order,
      HttpStatus.OK,
    );
  }

  @Post('shipping/estimate')
  async getShippingEstimate(
    @Body() estimateDto: ShippingEstimateDto,
    @UserId() userId: bigint,
  ): Promise<ApiResponse<ShippingEstimateResponse>> {
    this.logger.info({
      message: 'Getting shipping estimate',
      context: {
        operation: 'shipping_estimate',
        userId: userId.toString(),
        productCount: estimateDto.products.length,
        shipperAddressId: estimateDto.shipperAddressId?.toString(),
      },
    });

    const estimate = await this.orderService.getShippingEstimate(
      estimateDto,
      userId,
    );

    this.logger.info({
      message: 'Shipping estimate retrieved successfully',
      context: {
        operation: 'shipping_estimate',
        userId: userId.toString(),
        ok: estimate.ok,
        reason: estimate.reason,
      },
    });

    return ResponseHelper.CreateResponse<ShippingEstimateResponse>(
      'Shipping estimate retrieved successfully',
      estimate,
      HttpStatus.OK,
    );
  }
}
