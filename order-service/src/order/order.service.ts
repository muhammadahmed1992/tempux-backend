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
import {
  ShippingEstimateDto,
  ShippingEstimateResponse,
  ShippingEstimateProductPricing,
} from './dtos/shipping-estimate.dto';
import { AppLoggerService } from '../common/logging';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly shippingService: ShippingService,
    private readonly productProxyService: ProductProxyService,
    private readonly authProxyService: AuthProxyService,
    private readonly logger: AppLoggerService,
  ) {}

  async createOrder(
    createOrderDto: CreateOrderDto,
    userId: bigint,
  ): Promise<OrderResponseDto> {
    this.logger.info({
      message: 'Order creation service method started',
      context: {
        operation: 'create_order_service',
        userId: userId.toString(),
        buyerId: userId.toString(),
        itemCount: createOrderDto.orderItems?.length,
        productIds: createOrderDto.orderItems?.map((item) =>
          item.productId.toString(),
        ),
      },
    });

    try {
      // Validate products and inventory
      await this.validateOrderItems(createOrderDto.orderItems);

      // Extract Seller Id - assuming all items are from the same seller
      const sellerId = BigInt(createOrderDto.orderItems[0].sellerId);

      this.logger.info({
        message: 'Processing shipping address',
        context: {
          operation: 'shipping_address_processing',
          userId: userId.toString(),
          useSavedAddress: createOrderDto.useSavedShippingAddress,
          savedAddressId: createOrderDto.savedShippingAddressId?.toString(),
        },
      });

      // Handle shipping address
      let shippingAddressId: bigint | undefined;
      if (
        createOrderDto.useSavedShippingAddress &&
        createOrderDto.savedShippingAddressId
      ) {
        // Validate that the saved address belongs to the user
        this.logger.info({
          message: 'Validating saved shipping address ownership',
          context: {
            operation: 'validate_address_ownership',
            userId: userId.toString(),
            addressId: createOrderDto.savedShippingAddressId.toString(),
          },
        });

        const isValidAddress =
          await this.authProxyService.validateAddressOwnership(
            BigInt(createOrderDto.savedShippingAddressId),
            userId,
            'SHIPPING',
          );
        if (!isValidAddress) {
          this.logger.warn({
            message: 'Invalid shipping address provided',
            context: {
              operation: 'validate_address_ownership',
              userId: userId.toString(),
              addressId: createOrderDto.savedShippingAddressId.toString(),
            },
          });
          throw new BadRequestException('Invalid shipping address');
        }
        shippingAddressId = BigInt(createOrderDto.savedShippingAddressId);

        this.logger.info({
          message: 'Shipping address ownership validated',
          context: {
            operation: 'validate_address_ownership',
            userId: userId.toString(),
            addressId: createOrderDto.savedShippingAddressId.toString(),
          },
        });
      } else if (createOrderDto.shippingAddress) {
        // For new addresses, we'll create them in the database
        this.logger.info({
          message: 'Creating new shipping address',
          context: {
            operation: 'create_shipping_address',
            userId: userId.toString(),
            city: createOrderDto.shippingAddress.city,
            country: createOrderDto.shippingAddress.country,
          },
        });

        const newAddressId = await this.authProxyService.createShippingAddress(
          createOrderDto.shippingAddress,
          userId,
        );
        shippingAddressId = newAddressId;

        this.logger.info({
          message: 'New shipping address created',
          context: {
            operation: 'create_shipping_address',
            userId: userId.toString(),
            addressId: newAddressId.toString(),
          },
        });
      } else {
        this.logger.warn({
          message: 'No shipping address provided',
          context: {
            operation: 'create_order_service',
            userId: userId.toString(),
          },
        });
        throw new BadRequestException('Shipping address is required');
      }

      // Handle billing address
      let billingAddressId: bigint | undefined;
      if (createOrderDto.sameAsShippingAddress === true) {
        // Set billing address same as shipping address
        billingAddressId = shippingAddressId;
        this.logger.info({
          message: 'Billing address set same as shipping address',
          context: {
            operation: 'billing_address_processing',
            userId: userId.toString(),
            billingAddressId: billingAddressId.toString(),
          },
        });
      } else if (createOrderDto.billingAddressId) {
        // Validate that the saved billing address belongs to the user
        this.logger.info({
          message: 'Validating saved billing address ownership',
          context: {
            operation: 'validate_billing_address_ownership',
            userId: userId.toString(),
            addressId: createOrderDto.billingAddressId.toString(),
          },
        });

        const isValidBillingAddress =
          await this.authProxyService.validateAddressOwnership(
            BigInt(createOrderDto.billingAddressId),
            userId,
            'BILLING',
          );
        if (!isValidBillingAddress) {
          this.logger.warn({
            message: 'Invalid billing address provided',
            context: {
              operation: 'validate_billing_address_ownership',
              userId: userId.toString(),
              addressId: createOrderDto.billingAddressId.toString(),
            },
          });
          throw new BadRequestException('Invalid billing address');
        }
        billingAddressId = BigInt(createOrderDto.billingAddressId);

        this.logger.info({
          message: 'Billing address ownership validated',
          context: {
            operation: 'validate_billing_address_ownership',
            userId: userId.toString(),
            addressId: createOrderDto.billingAddressId.toString(),
          },
        });
      } else if (createOrderDto.billingAddress) {
        // For new billing addresses, create them in the database
        this.logger.info({
          message: 'Creating new billing address',
          context: {
            operation: 'create_billing_address',
            userId: userId.toString(),
            city: createOrderDto.billingAddress.city,
            country: createOrderDto.billingAddress.country,
          },
        });

        const newBillingAddressId =
          await this.authProxyService.createBillingAddress(
            createOrderDto.billingAddress,
            userId,
          );
        billingAddressId = newBillingAddressId;

        this.logger.info({
          message: 'New billing address created',
          context: {
            operation: 'create_billing_address',
            userId: userId.toString(),
            addressId: newBillingAddressId.toString(),
          },
        });
      } else {
        // If no billing address specified and not same as shipping, use shipping as default
        billingAddressId = shippingAddressId;
        this.logger.info({
          message:
            'No billing address specified, using shipping address as default',
          context: {
            operation: 'billing_address_processing',
            userId: userId.toString(),
            billingAddressId: billingAddressId.toString(),
          },
        });
      }

      // Get shipping rate quote
      this.logger.info({
        message: 'Getting shipping rate quote',
        context: {
          operation: 'get_shipping_rate',
          userId: userId.toString(),
          shippingAddressId: shippingAddressId.toString(),
          sellerId: sellerId.toString(),
        },
      });

      const shippingRate = await this.shippingService.getRateQuote({
        shippingAddressId: shippingAddressId!,
        orderItems: createOrderDto.orderItems,
        userId,
        sellerId,
      });

      this.logger.info({
        message: 'Shipping rate quote received',
        context: {
          operation: 'get_shipping_rate',
          userId: userId.toString(),
          totalCost: shippingRate.totalCost.toString(),
          shippingAddressId: shippingAddressId.toString(),
        },
      });

      // Prepare order data
      const orderData: Prisma.ordersCreateInput = {
        buyer_id: userId, // Use userId from auth context instead of body
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
        total_price:
          item.price * item.quantity - item.discount + item.taxAmount,
        order_status: 'PENDING',
        payout_status: 'PENDING',
        escrow_status: 'HELD',
        created_by: userId,
      }));

      this.logger.info({
        message: 'Creating order with items in repository',
        context: {
          operation: 'create_order_repository',
          userId: userId.toString(),
          orderItemCount: orderItemsData.length,
        },
      });

      // Create order with items
      const { order, orderItems } =
        await this.orderRepository.createOrderWithItems(
          orderData,
          orderItemsData,
        );

      this.logger.info({
        message: 'Order and items created in repository',
        context: {
          operation: 'create_order_repository',
          userId: userId.toString(),
          orderId: order.id.toString(),
          orderItemCount: orderItems.length,
        },
      });

      // Create shipments for order items
      this.logger.info({
        message: 'Creating shipments for order items',
        context: {
          operation: 'create_shipments',
          userId: userId.toString(),
          orderId: order.id.toString(),
          orderItemCount: orderItems.length,
        },
      });

      await this.shippingService.createShipmentsForOrder(
        order.id,
        orderItems,
        userId,
        shippingAddressId,
      );

      this.logger.info({
        message: 'Shipments created successfully',
        context: {
          operation: 'create_shipments',
          userId: userId.toString(),
          orderId: order.id.toString(),
        },
      });

      const result = this.mapToOrderResponse(order, orderItems);

      this.logger.info({
        message: 'Order creation completed successfully',
        context: {
          operation: 'create_order_service',
          userId: userId.toString(),
          orderId: order.id.toString(),
          totalAmount: result.totalAmount.toString(),
        },
      });

      return result;
    } catch (error: any) {
      this.logger.error({
        message: 'Order creation failed',
        context: {
          operation: 'create_order_service',
          userId: userId.toString(),
          buyerId: userId.toString(),
        },
        error,
      });
      throw error;
    }
  }

  async getOrder(orderId: bigint): Promise<OrderResponseDto> {
    this.logger.info({
      message: 'Getting order by ID',
      context: {
        operation: 'get_order_service',
        orderId: orderId.toString(),
      },
    });

    const orderWithItems = await this.orderRepository.getOrderWithItems(
      orderId,
    );
    if (!orderWithItems) {
      this.logger.warn({
        message: 'Order not found',
        context: {
          operation: 'get_order_service',
          orderId: orderId.toString(),
        },
      });
      throw new BadRequestException('Order not found');
    }

    this.logger.info({
      message: 'Order retrieved successfully',
      context: {
        operation: 'get_order_service',
        orderId: orderId.toString(),
        buyerId: orderWithItems.buyer_id.toString(),
        itemCount: orderWithItems.order_items.length,
      },
    });

    return this.mapToOrderResponse(orderWithItems, orderWithItems.order_items);
  }

  async getOrdersByBuyerId(
    buyerId: bigint,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<{ data: OrderListingDto[]; totalCount: number }> {
    this.logger.info({
      message: 'Getting orders by buyer ID',
      context: {
        operation: 'get_orders_by_buyer_service',
        buyerId: buyerId.toString(),
        page,
        pageSize,
      },
    });

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

    this.logger.info({
      message: 'Orders retrieved by buyer ID',
      context: {
        operation: 'get_orders_by_buyer_service',
        buyerId: buyerId.toString(),
        totalCount: result.totalCount,
        page,
        pageSize,
      },
    });

    return { data: orderListings, totalCount: result.totalCount };
  }

  async updateOrderStatus(
    orderId: bigint,
    status: string,
    userId: bigint,
  ): Promise<OrderResponseDto> {
    this.logger.info({
      message: 'Updating order status',
      context: {
        operation: 'update_order_status_service',
        orderId: orderId.toString(),
        userId: userId.toString(),
        newStatus: status,
      },
    });

    const order = await this.orderRepository.updateOrderStatus(
      orderId,
      status,
      userId,
    );
    const orderWithItems = await this.orderRepository.getOrderWithItems(
      orderId,
    );

    if (!orderWithItems) {
      this.logger.warn({
        message: 'Order not found during status update',
        context: {
          operation: 'update_order_status_service',
          orderId: orderId.toString(),
          userId: userId.toString(),
        },
      });
      throw new BadRequestException('Order not found');
    }

    this.logger.info({
      message: 'Order status updated successfully',
      context: {
        operation: 'update_order_status_service',
        orderId: orderId.toString(),
        userId: userId.toString(),
        newStatus: status,
        previousStatus: order.order_status,
      },
    });

    return this.mapToOrderResponse(orderWithItems, orderWithItems.order_items);
  }

  private async validateOrderItems(
    orderItems: CreateOrderItemDto[],
  ): Promise<void> {
    this.logger.info({
      message: 'Validating order items',
      context: {
        operation: 'validate_order_items',
        itemCount: orderItems.length,
        productIds: orderItems.map((item) => item.productId.toString()),
      },
    });

    for (const item of orderItems) {
      this.logger.info({
        message: 'Validating individual order item',
        context: {
          operation: 'validate_order_item',
          productId: item.productId.toString(),
          productVariantId: item.productVariantId.toString(),
          quantity: item.quantity,
        },
      });

      // Validate product exists and has sufficient inventory
      const productVariant = await this.productProxyService.getProductVariant(
        BigInt(item.productVariantId),
      );
      if (!productVariant) {
        this.logger.warn({
          message: 'Product variant not found',
          context: {
            operation: 'validate_order_item',
            productVariantId: item.productVariantId.toString(),
          },
        });
        throw new BadRequestException(
          `Product variant ${item.productVariantId} not found`,
        );
      }

      if (productVariant.quantity < item.quantity) {
        this.logger.warn({
          message: 'Insufficient inventory for product variant',
          context: {
            operation: 'validate_order_item',
            productVariantId: item.productVariantId.toString(),
            requestedQuantity: item.quantity,
            availableQuantity: productVariant.quantity,
          },
        });
        throw new BadRequestException(
          `Insufficient inventory for product variant ${item.productVariantId}`,
        );
      }

      this.logger.info({
        message: 'Order item validation passed',
        context: {
          operation: 'validate_order_item',
          productVariantId: item.productVariantId.toString(),
          quantity: item.quantity,
          availableQuantity: productVariant.quantity,
        },
      });
    }

    this.logger.info({
      message: 'All order items validated successfully',
      context: {
        operation: 'validate_order_items',
        itemCount: orderItems.length,
      },
    });
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

  async getShippingEstimate(
    estimateDto: ShippingEstimateDto,
    userId: bigint,
  ): Promise<ShippingEstimateResponse> {
    this.logger.info({
      message: 'Getting shipping estimate',
      context: {
        operation: 'get_shipping_estimate_service',
        userId: userId.toString(),
        productCount: estimateDto.products.length,
      },
    });

    try {
      // Get buyer address
      const buyerAddress = await this.authProxyService.findAddressById(
        BigInt(estimateDto.shipperAddressId!),
        userId,
      );

      if (!buyerAddress) {
        this.logger.warn({
          message: 'Buyer address not found for shipping estimate',
          context: {
            operation: 'get_shipping_estimate_service',
            userId: userId.toString(),
            shipperAddressId: estimateDto.shipperAddressId,
          },
        });

        return {
          ok: false,
          reason: 'MISSING_ADDRESS',
          missing: {
            buyer: true,
            sellers: [],
          },
          productsPricing: [],
        };
      }

      // Get product pricing and seller information
      const productsPricing: ShippingEstimateProductPricing[] = [];
      const sellers = new Set<bigint>();
      let productsTotal = 0;

      for (const product of estimateDto.products) {
        try {
          const productVariant =
            await this.productProxyService.getProductVariant(
              BigInt(product.productId),
            );

          if (productVariant) {
            const subtotal = productVariant.price * product.quantity;
            productsPricing.push({
              productId: product.productId,
              unitPrice: productVariant.price,
              quantity: product.quantity,
              subtotal,
            });
            productsTotal += subtotal;
            sellers.add(BigInt(productVariant.sellerId || 0));
          }
        } catch (error: any) {
          this.logger.warn({
            message: 'Failed to get product variant for shipping estimate',
            context: {
              operation: 'get_shipping_estimate_service',
              productId: product.productId.toString(),
              error: error.message,
            },
          });
        }
      }

      // Check seller addresses
      const sellerAddressChecks = [];
      for (const sellerId of sellers) {
        try {
          const sellerAddress = await this.authProxyService.findAddressById(
            sellerId,
            sellerId, // Assuming seller is looking up their own address
          );
          sellerAddressChecks.push({
            sellerId,
            missing: !sellerAddress,
          });
        } catch (error: any) {
          sellerAddressChecks.push({
            sellerId,
            missing: true,
          });
        }
      }

      const hasMissingSellerAddresses = sellerAddressChecks.some(
        (check) => check.missing,
      );

      if (hasMissingSellerAddresses) {
        this.logger.warn({
          message: 'Some seller addresses missing for shipping estimate',
          context: {
            operation: 'get_shipping_estimate_service',
            userId: userId.toString(),
            missingSellers: sellerAddressChecks
              .filter((check) => check.missing)
              .map((check) => check.sellerId.toString()),
          },
        });

        return {
          ok: false,
          reason: 'MISSING_ADDRESS',
          missing: {
            buyer: false,
            sellers: sellerAddressChecks,
          },
          productsPricing,
        };
      }

      // Calculate shipping cost (simplified - in real implementation, call shipping service)
      const totalShipping = 45; // Placeholder - should come from shipping service
      const grandTotal = productsTotal + totalShipping;

      this.logger.info({
        message: 'Shipping estimate calculated successfully',
        context: {
          operation: 'get_shipping_estimate_service',
          userId: userId.toString(),
          productsTotal,
          totalShipping,
          grandTotal,
        },
      });

      return {
        ok: true,
        currency: 'USD',
        lineItems: productsPricing,
        productsTotal,
        totalShipping,
        grandTotal,
      };
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to get shipping estimate',
        context: {
          operation: 'get_shipping_estimate_service',
          userId: userId.toString(),
        },
        error,
      });
      throw error;
    }
  }
}
