import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrderRepository } from './order.repository';
import { ShippingService } from '../shipping/shipping.service';
import { ProductProxyService } from '../proxy/product-proxy/product-proxy.service';
import { AuthProxyService } from '../proxy/auth-proxy/auth-proxy.service';
import {
  CreateOrderDto,
  CreateOrderItemDto,
  ShippingAddressDto,
} from './dtos/create-order.dto';
import { OrderResponseDto, OrderListingDto } from './dtos/order-response.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly shippingService: ShippingService,
    private readonly productProxyService: ProductProxyService,
    private readonly authProxyService: AuthProxyService,
  ) {}

  async createOrder(
    createOrderDto: CreateOrderDto,
    userId: bigint,
  ): Promise<OrderResponseDto> {
    // Validate products and inventory
    await this.validateOrderItems(createOrderDto.orderItems);
   // Extract Seller Id - assuming all items are from the same seller
  const sellerId = BigInt(createOrderDto.orderItems[0].sellerId);
    // Handle shipping address
    let shippingAddressId: bigint | undefined;
    if (
      createOrderDto.useSavedShippingAddress &&
      createOrderDto.savedShippingAddressId
    ) {
      // Validate that the saved address belongs to the user
      const isValidAddress =
        await this.authProxyService.validateAddressOwnership(
          BigInt(createOrderDto.savedShippingAddressId),
          userId,
          'SHIPPING',
        );
      if (!isValidAddress) {
        throw new BadRequestException('Invalid shipping address');
      }
      shippingAddressId = BigInt(createOrderDto.savedShippingAddressId);
    } else if (createOrderDto.shippingAddress) {
      // For new addresses, we'll create them in the database
      const newAddressId = await this.authProxyService.createShippingAddress(
        createOrderDto.shippingAddress,
        userId,
      );
      shippingAddressId = newAddressId;
    } else {
      throw new BadRequestException('Shipping address is required');
    }

    // Get shipping rate quote
    const shippingRate = await this.shippingService.getRateQuote({
      shippingAddressId: shippingAddressId!,
      orderItems: createOrderDto.orderItems,
      userId,
      sellerId
    });

    // Prepare order data
    const orderData: Prisma.ordersCreateInput = {
      buyer_id: BigInt(createOrderDto.buyerId),
      product_Id: BigInt(createOrderDto.orderItems[0].productId),
      total_discount: createOrderDto.totalDiscount,
      total_tax: createOrderDto.totalTax,
      total_shipping_cost: shippingRate.totalCost,
      total_amount: createOrderDto.totalAmount,
      order_status: 'PENDING',
      created_by: userId,
    };

    // Prepare order items data
    const orderItemsData: Omit<
      Prisma.order_itemUncheckedCreateInput,
      'order_id'
    >[] = createOrderDto.orderItems.map((item: CreateOrderItemDto) => ({
      seller_id: BigInt(item.sellerId),
      product_Id: BigInt(item.productId),
      product_variant_id: BigInt(item.productVariantId),
      quantity: item.quantity,
      price: item.price,
      discount: item.discount,
      tax_amount: item.taxAmount,
      total_price: item.price * item.quantity - item.discount + item.taxAmount,
      order_status: 'PENDING',
      payout_status: 'PENDING',
      escrow_status: 'HELD',
      created_by: userId,
    }));

    // Create order with items
    const { order, orderItems } =
      await this.orderRepository.createOrderWithItems(
        orderData,
        orderItemsData,

      );

    // Create shipments for order items
    await this.shippingService.createShipmentsForOrder(order.id, orderItems ,
      userId, shippingAddressId);

    return this.mapToOrderResponse(order, orderItems);
  }

  async getOrder(orderId: bigint): Promise<OrderResponseDto> {
    const orderWithItems = await this.orderRepository.getOrderWithItems(
      orderId,
    );
    if (!orderWithItems) {
      throw new BadRequestException('Order not found');
    }

    return this.mapToOrderResponse(orderWithItems, orderWithItems.order_items);
  }

  async getOrdersByBuyerId(
    buyerId: bigint,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<{ data: OrderListingDto[]; totalCount: number }> {
    const result = await this.orderRepository.getOrdersByBuyerId(
      buyerId,
      page,
      pageSize,
    );

    const orderListings: OrderListingDto[] = result.data.map((order) => ({
      id: order.id,
      buyerId: order.buyer_id,
      totalAmount: Number(order.total_amount),
      orderDate: order.order_date,
      orderStatus: order.order_status,
      paymentStatus: 'PENDING', // Default since not in schema
      fulfillmentStatus: 'PENDING', // Default since not in schema
      itemCount: 0, // This would need to be calculated from order items
    }));

    return { data: orderListings, totalCount: result.totalCount };
  }

  async updateOrderStatus(
    orderId: bigint,
    status: string,
    userId: bigint,
  ): Promise<OrderResponseDto> {
    const order = await this.orderRepository.updateOrderStatus(
      orderId,
      status,
      userId,
    );
    const orderWithItems = await this.orderRepository.getOrderWithItems(
      orderId,
    );

    if (!orderWithItems) {
      throw new BadRequestException('Order not found');
    }

    return this.mapToOrderResponse(orderWithItems, orderWithItems.order_items);
  }

  private async validateOrderItems(
    orderItems: CreateOrderItemDto[],
  ): Promise<void> {
    for (const item of orderItems) {
      // Validate product exists and has sufficient inventory
      const productVariant = await this.productProxyService.getProductVariant(
        BigInt(item.productVariantId),
      );
      if (!productVariant) {
        throw new BadRequestException(
          `Product variant ${item.productVariantId} not found`,
        );
      }

      if (productVariant.quantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient inventory for product variant ${item.productVariantId}`,
        );
      }
    }
  }

  private mapToOrderResponse(order: any, orderItems: any[]): OrderResponseDto {
    return {
      id: order.id,
      buyerId: order.buyer_id,
      totalDiscount: Number(order.total_discount),
      totalTax: Number(order.total_tax),
      totalShippingCost: Number(order.total_shipping_cost),
      totalAmount: Number(order.total_amount),
      orderDate: order.order_date,
      orderStatus: order.order_status,
      paymentStatus: 'PENDING', // Default since not in schema
      fulfillmentStatus: 'PENDING', // Default since not in schema
      shippingAddressId: undefined, // Not in schema
      billingAddressId: undefined, // Not in schema
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      orderItems: orderItems.map((item) => ({
        id: item.id,
        orderId: item.order_id,
        sellerId: item.seller_id,
        productId: item.product_Id,
        productVariantId: item.product_variant_id,
        quantity: item.quantity,
        price: Number(item.price),
        discount: Number(item.discount),
        taxAmount: Number(item.tax_amount),
        totalPrice: Number(item.total_price),
        orderStatus: item.order_status,
        payoutStatus: item.payout_status,
        escrowStatus: item.escrow_status,
        orderItemDate: item.order_item_date,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })),
    };
  }
}
