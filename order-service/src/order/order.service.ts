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
import {
  OrderResponseDto,
  OrderListingDto,
  SellerOrderDto,
} from './dtos/order-response.dto';
import {
  ShippingEstimateDto,
  ShippingEstimateResponse,
  ShippingEstimateProductPricing,
} from './dtos/shipping-estimate.dto';
import { AppLoggerService } from '../common/logging';
import { PaymentService } from '../payments/payment.service';

interface ProductInventory {
  id: bigint;
  quantity: number;
}
@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly shippingService: ShippingService,
    private readonly productProxyService: ProductProxyService,
    private readonly authProxyService: AuthProxyService,
    private readonly logger: AppLoggerService,
    private readonly paymentService: PaymentService,
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
      // Prisma transaction with pessimistic locking
      return await this.orderRepository.getPrisma().$transaction(
        async (tx) => {
          // Get all unique product IDs that need to be locked
          const uniqueProductIds = [
            ...new Set(createOrderDto.orderItems.map((item) => item.productId)),
          ].sort((a, b) => Number(a) - Number(b));

          this.logger.info({
            message: 'Acquiring pessimistic locks for inventory rows',
            context: {
              operation: 'pessimistic_locking',
              userId: userId.toString(),
              productIds: uniqueProductIds.map((id) => id.toString()),
            },
          });

          // Lock only the specific products we need
          for (const productId of uniqueProductIds) {
            await tx.$executeRaw`SELECT * FROM products.product WHERE id = ${productId} FOR UPDATE`;
          }

          this.logger.info({
            message: 'Pessimistic locks acquired successfully',
            context: {
              operation: 'pessimistic_locking',
              userId: userId.toString(),
              productIds: uniqueProductIds.map((id) => id.toString()),
            },
          });
          // Validate products and inventory within the locked transaction
          const validationResult = await this.validateOrderItemsWithExceptions(
            createOrderDto.orderItems,
            tx,
          );

          // If all items failed validation, throwing error
          if (
            validationResult.exceptions.length ===
            createOrderDto.orderItems.length
          ) {
            this.logger.warn({
              message: 'All order items failed validation',
              context: {
                operation: 'create_order_service',
                userId: userId.toString(),
                exceptionCount: validationResult.exceptions.length,
              },
            });
            throw new BadRequestException('All order items failed validation');
          }

          // Filter out items that failed validation
          const validItems = createOrderDto.orderItems.filter(
            (item) =>
              !validationResult.exceptions.some(
                (ex) => ex.productId === item.productId,
              ),
          );

          this.logger.info({
            message: 'Processing valid order items',
            context: {
              operation: 'create_order_service',
              userId: userId.toString(),
              validItemCount: validItems.length,
              failedItemCount: validationResult.exceptions.length,
            },
          });

          // Group valid items by seller for multi-seller order creation
          const itemsBySeller = this.groupItemsBySeller(validItems);

          this.logger.log({
            message: 'Debugging grouped items by seller',
            context: {
              operation: 'group_items_by_seller',
              itemCount: Array.from(itemsBySeller.entries()).map(
                ([sellerId, items]) => ({
                  sellerId: sellerId.toString(),
                  itemCount: items.length,
                }),
              ),
            },
          });

          this.logger.info({
            message: 'Processing shipping address',
            context: {
              operation: 'shipping_address_processing',
              userId: userId.toString(),
              useSavedAddress: createOrderDto.useSavedShippingAddress,
              savedAddressId: createOrderDto.savedShippingAddressId?.toString(),
            },
          });

          // Handle shipping and billing addresses (reused for all seller orders)
          const { shippingAddressId, billingAddressId } =
            await this.processAddresses(createOrderDto, userId);

          // Create orders for each seller
          const sellerOrdersData = await this.prepareSellerOrdersData(
            itemsBySeller,
            shippingAddressId,
            userId,
            validationResult.exceptions.length > 0,
          );

          this.logger.info({
            message: 'Creating multi-seller orders in repository',
            context: {
              operation: 'create_multi_seller_orders',
              userId: userId.toString(),
              sellerCount: sellerOrdersData.length,
              totalItems: validItems.length,
            },
          });

          // Create all seller orders within the transaction
          const sellerOrderResults =
            await this.orderRepository.createMultiSellerOrdersInTransaction(
              sellerOrdersData,
              tx,
            );

          this.logger.info({
            message: 'Multi-seller orders created in repository',
            context: {
              operation: 'create_multi_seller_orders',
              userId: userId.toString(),
              createdOrders: sellerOrderResults.map((result) => ({
                orderId: result.order.id.toString(),
                itemCount: result.orderItems.length,
              })),
            },
          });

          // Update inventory quantities within the transaction
          for (const item of validItems) {
            await tx.$executeRaw`
            UPDATE products.product
            SET quantity = quantity - ${item.quantity}
            WHERE id = ${item.productId}
          `;
          }

          this.logger.info({
            message: 'Inventory quantities updated successfully',
            context: {
              operation: 'inventory_update',
              userId: userId.toString(),
              updatedProducts: validItems.map((item) => ({
                productId: item.productId.toString(),
                quantityReduced: item.quantity,
              })),
            },
          });

          // Create shipments for each seller order
          for (const { order, orderItems } of sellerOrderResults) {
            this.logger.info({
              message: 'Creating shipments for seller order',
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
              message: 'Shipments created successfully for seller order',
              context: {
                operation: 'create_shipments',
                userId: userId.toString(),
                orderId: order.id.toString(),
              },
            });
          }

          // Build the aggregate response
          const result = this.buildMultiSellerOrderResponse(
            sellerOrderResults,
            validationResult.exceptions,
          );

          // Create payment intent for the order after successful creation
          await this.createPaymentIntentForOrder(result, userId);

          this.logger.info({
            message: 'Multi-seller order creation completed successfully',
            context: {
              operation: 'create_order_service',
              userId: userId.toString(),
              sellerOrderCount: sellerOrderResults.length,
              totalAmount: result.totalAmount.toString(),
              exceptionCount: validationResult.exceptions.length,
            },
          });

          return result;
        },
        {
          timeout: 30000, // 30 seconds
          maxWait: 60000, // Optional, 60 seconds to wait for connection
        },
      );
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

    // Trigger fund transfers if order is marked as DELIVERED
    if (status === 'DELIVERED') {
      this.logger.info({
        message: 'Order marked as DELIVERED, triggering fund transfers',
        context: {
          operation: 'update_order_status_service',
          orderId: orderId.toString(),
          userId: userId.toString(),
        },
      });

      try {
        // Process transfers asynchronously to avoid blocking the status update
        this.processOrderTransfersAsync(orderId);
      } catch (error: any) {
        this.logger.error({
          message: 'Failed to trigger fund transfers after order delivery',
          context: {
            operation: 'update_order_status_service',
            orderId: orderId.toString(),
            userId: userId.toString(),
            error: error.message,
          },
          error,
        });
        // Don't throw error here to avoid blocking the status update
      }
    }

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
          quantity: item.quantity,
        },
      });

      // Validate product exists and has sufficient inventory
      const product = await this.productProxyService.getProduct(
        BigInt(item.productId),
      );
      if (!product) {
        this.logger.warn({
          message: 'Product not found',
          context: {
            operation: 'validate_order_item',
            productId: item.productId.toString(),
          },
        });
        throw new BadRequestException(`Product ${item.productId} not found`);
      }

      if (product.quantity < item.quantity) {
        this.logger.warn({
          message: 'Insufficient inventory for product',
          context: {
            operation: 'validate_order_item',
            productId: item.productId.toString(),
            requestedQuantity: item.quantity,
            availableQuantity: product.quantity,
          },
        });
        throw new BadRequestException(
          `Insufficient inventory for product ${item.productId}`,
        );
      }

      this.logger.info({
        message: 'Order item validation passed',
        context: {
          operation: 'validate_order_item',
          productId: item.productId.toString(),
          quantity: item.quantity,
          availableQuantity: product.quantity,
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

  private async validateOrderItemsWithTransaction(
    orderItems: CreateOrderItemDto[],
    tx: any, // Prisma transaction object
  ): Promise<void> {
    this.logger.info({
      message: 'Validating order items within transaction',
      context: {
        operation: 'validate_order_items_transaction',
        itemCount: orderItems.length,
        productIds: orderItems.map((item) => item.productId.toString()),
      },
    });

    for (const item of orderItems) {
      this.logger.info({
        message: 'Validating individual order item within transaction',
        context: {
          operation: 'validate_order_item_transaction',
          productId: item.productId.toString(),
          quantity: item.quantity,
        },
      });

      // Validate product exists and has sufficient inventory within the transaction
      const product = await tx.product.findUnique({
        where: {
          id: BigInt(item.productId),
        },
      });

      if (!product) {
        this.logger.warn({
          message: 'Product not found within transaction',
          context: {
            operation: 'validate_order_item_transaction',
            productId: item.productId.toString(),
          },
        });
        throw new BadRequestException(`Product ${item.productId} not found`);
      }

      if (product.quantity < item.quantity) {
        this.logger.warn({
          message: 'Insufficient inventory for product within transaction',
          context: {
            operation: 'validate_order_item_transaction',
            productId: item.productId.toString(),
            requestedQuantity: item.quantity,
            availableQuantity: product.quantity,
          },
        });
        throw new BadRequestException(
          `Insufficient inventory for product ${item.productId}`,
        );
      }

      this.logger.info({
        message: 'Order item validation passed within transaction',
        context: {
          operation: 'validate_order_item_transaction',
          productId: item.productId.toString(),
          quantity: item.quantity,
          availableQuantity: product.quantity,
        },
      });
    }

    this.logger.info({
      message: 'All order items validated successfully within transaction',
      context: {
        operation: 'validate_order_items_transaction',
        itemCount: orderItems.length,
      },
    });
  }

  private async validateOrderItemsWithExceptions(
    orderItems: CreateOrderItemDto[],
    tx: any, // Prisma transaction object
  ): Promise<{ exceptions: { productId: bigint; message: string }[] }> {
    const exceptions: { productId: bigint; message: string }[] = [];

    for (const item of orderItems) {
      try {
        this.logger.info({
          message: 'Validating individual order item with exceptions',
          context: {
            operation: 'validate_order_item_with_exceptions',
            productId: item.productId.toString(),
            quantity: item.quantity,
          },
        });

        // Validate product exists and has sufficient inventory within the transaction.
        // Using raw query because product table is accessible in order service
        const product: ProductInventory[] = await tx.$queryRaw`
        SELECT id, quantity
        FROM products.product
        WHERE id = ${BigInt(item.productId)}
      `;

        if (!product || product.length === 0) {
          this.logger.warn({
            message: 'Product not found within transaction',
            context: {
              operation: 'validate_order_item_with_exceptions',
              productId: item.productId.toString(),
            },
          });
          exceptions.push({
            productId: BigInt(item.productId),
            message: `Product ${item.productId} not found`,
          });
          continue;
        }
        // Get the first and only product
        const productData = product[0];

        if (productData.quantity < item.quantity) {
          this.logger.warn({
            message: 'Insufficient inventory for product within transaction',
            context: {
              operation: 'validate_order_item_with_exceptions',
              productId: item.productId.toString(),
              requestedQuantity: item.quantity,
              availableQuantity: productData.quantity,
            },
          });
          exceptions.push({
            productId: BigInt(item.productId),
            message: `Insufficient inventory for product ${item.productId}`,
          });
          continue;
        }

        this.logger.info({
          message: 'Order item validation passed within transaction',
          context: {
            operation: 'validate_order_item_with_exceptions',
            productId: item.productId.toString(),
            quantity: item.quantity,
            availableQuantity: productData.quantity,
          },
        });
      } catch (error: any) {
        this.logger.warn({
          message: 'Failed to validate individual order item with exceptions',
          context: {
            operation: 'validate_order_item_with_exceptions',
            productId: item.productId.toString(),
            error: error.message,
          },
        });
        exceptions.push({
          productId: BigInt(item.productId),
          message: error.message,
        });
      }
    }

    this.logger.info({
      message: 'All order items validated successfully with exceptions',
      context: {
        operation: 'validate_order_items_with_exceptions',
        itemCount: orderItems.length,
        exceptionCount: exceptions.length,
      },
    });

    return { exceptions };
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

  private groupItemsBySeller(
    items: CreateOrderItemDto[],
  ): Map<bigint, CreateOrderItemDto[]> {
    const itemsBySeller = new Map<bigint, CreateOrderItemDto[]>();

    this.logger.log({
      message: 'Debugging items by seller',
      context: {
        operation: 'group_items_by_seller',
        itemCount: items.map((item) => ({
          sellerId: item.sellerId,
          productId: item.productId,
          quantity: item.quantity,
        })),
      },
    });

    for (const item of items) {
      const sellerId = BigInt(item.sellerId);
      const sellerItems = itemsBySeller.get(sellerId) || [];
      sellerItems.push(item);
      itemsBySeller.set(sellerId, sellerItems);
    }

    return itemsBySeller;
  }

  private async processAddresses(
    createOrderDto: CreateOrderDto,
    userId: bigint,
  ): Promise<{ shippingAddressId: bigint; billingAddressId: bigint }> {
    // Handle billing address first
    let billingAddressId: bigint | undefined;
    if (createOrderDto.billingAddressId) {
      // Validate that the saved billing address belongs to the user
      this.logger.info({
        message: 'Validating saved billing address ownership',
        context: {
          operation: 'validate_billing_address_ownership',
          userId: userId.toString(),
          addressId: createOrderDto.billingAddressId.toString(),
        },
      });

      const isValidAddress =
        await this.authProxyService.validateAddressOwnership(
          BigInt(createOrderDto.billingAddressId),
          userId,
          'BILLING',
        );
      if (!isValidAddress) {
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
      this.logger.warn({
        message: 'No billing address provided',
        context: {
          operation: 'create_order_service',
          userId: userId.toString(),
        },
      });
      throw new BadRequestException('Billing address is required');
    }

    // Handle shipping address
    let shippingAddressId: bigint | undefined;
    if (createOrderDto.sameAsBillingAddress === true) {
      // Set shipping address same as billing address
      shippingAddressId = billingAddressId;
      this.logger.info({
        message: 'Shipping address set same as billing address',
        context: {
          operation: 'shipping_address_processing',
          userId: userId.toString(),
          shippingAddressId: shippingAddressId.toString(),
        },
      });
    } else if (
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
      // Todo: will add a flag to save new shipping address and will create in database when only flag is true
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
      // If no shipping address specified and not same as billing, use billing as default
      shippingAddressId = billingAddressId;
      this.logger.info({
        message:
          'No shipping address specified, using billing address as default',
        context: {
          operation: 'shipping_address_processing',
          userId: userId.toString(),
          shippingAddressId: shippingAddressId.toString(),
        },
      });
    }

    return { shippingAddressId, billingAddressId };
  }

  private async prepareSellerOrdersData(
    itemsBySeller: Map<bigint, CreateOrderItemDto[]>,
    shippingAddressId: bigint,
    userId: bigint,
    hasExceptions: boolean,
  ): Promise<
    Array<{
      orderData: Prisma.ordersCreateInput;
      orderItemsData: Omit<Prisma.order_itemUncheckedCreateInput, 'order_id'>[];
    }>
  > {
    const sellerOrdersData = [];

    for (const [sellerId, sellerItems] of Array.from(itemsBySeller.entries())) {
      this.logger.info({
        message: 'Getting shipping rate quote for seller',
        context: {
          operation: 'get_shipping_rate',
          userId: userId.toString(),
          shippingAddressId: shippingAddressId.toString(),
          sellerId: sellerId.toString(),
          itemCount: sellerItems.length,
        },
      });

      const shippingRate = await this.shippingService.getRateQuote({
        shippingAddressId,
        orderItems: sellerItems,
        userId,
        sellerId,
      });

      this.logger.info({
        message: 'Shipping rate quote received for seller',
        context: {
          operation: 'get_shipping_rate',
          userId: userId.toString(),
          sellerId: sellerId.toString(),
          totalCost: shippingRate.totalCost.toString(),
        },
      });

      // Calculate totals for this seller's items
      const sellerItemsTotal = sellerItems.reduce(
        (sum, item) =>
          sum + (item.price * item.quantity - item.discount + item.taxAmount),
        0,
      );

      // Prepare order data for this seller
      const orderData: Prisma.ordersCreateInput = {
        buyer_id: userId,
        product_Id: BigInt(sellerItems[0].productId), // First product as reference
        total_discount: sellerItems.reduce(
          (sum, item) => sum + item.discount,
          0,
        ),
        total_tax: sellerItems.reduce((sum, item) => sum + item.taxAmount, 0),
        total_shipping_cost: shippingRate.totalCost,
        total_amount: sellerItemsTotal + shippingRate.totalCost,
        order_status: hasExceptions ? 'PARTIAL' : 'CREATED',
        created_by: userId,
      };

      // Prepare order items data for this seller
      const orderItemsData: Omit<
        Prisma.order_itemUncheckedCreateInput,
        'order_id'
      >[] = sellerItems.map((item: CreateOrderItemDto) => ({
        seller_id: BigInt(item.sellerId),
        product_Id: BigInt(item.productId),
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
        tax_amount: item.taxAmount,
        total_price:
          item.price * item.quantity - item.discount + item.taxAmount,
        order_status: 'CREATED',
        payout_status: 'PENDING',
        escrow_status: 'HELD',
        created_by: userId,
      }));

      sellerOrdersData.push({ orderData, orderItemsData });
    }

    return sellerOrdersData;
  }

  private buildMultiSellerOrderResponse(
    sellerOrderResults: Array<{ order: any; orderItems: any[] }>,
    exceptions: Array<{ productId: bigint; message: string }>,
  ): OrderResponseDto {
    // Calculate aggregate totals
    const aggregateTotalDiscount = sellerOrderResults.reduce(
      (sum, result) => sum + Number(result.order.total_discount),
      0,
    );
    const aggregateTotalTax = sellerOrderResults.reduce(
      (sum, result) => sum + Number(result.order.total_tax),
      0,
    );
    const aggregateTotalShippingCost = sellerOrderResults.reduce(
      (sum, result) => sum + Number(result.order.total_shipping_cost),
      0,
    );
    const aggregateTotalAmount = sellerOrderResults.reduce(
      (sum, result) => sum + Number(result.order.total_amount),
      0,
    );

    // Get all order items for the main response
    const allOrderItems = sellerOrderResults.flatMap(
      (result) => result.orderItems,
    );

    // Use the first order as the primary order for response structure
    const primaryOrder = sellerOrderResults[0].order;

    // Build seller orders array
    const sellerOrders = sellerOrderResults.map(({ order, orderItems }) => ({
      id: order.id,
      sellerId: orderItems[0]?.seller_id || BigInt(0),
      buyerId: order.buyer_id,
      totalDiscount: Number(order.total_discount),
      totalTax: Number(order.total_tax),
      totalShippingCost: Number(order.total_shipping_cost),
      totalAmount: Number(order.total_amount),
      orderDate: order.order_date,
      orderStatus: order.order_status,
      paymentStatus: 'PENDING',
      fulfillmentStatus: 'PENDING',
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      orderItems: orderItems.map((item) => ({
        id: item.id,
        orderId: item.order_id,
        sellerId: item.seller_id,
        productId: item.product_Id,
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
    }));

    const result: OrderResponseDto = {
      id: primaryOrder.id,
      buyerId: primaryOrder.buyer_id,
      totalDiscount: aggregateTotalDiscount,
      totalTax: aggregateTotalTax,
      totalShippingCost: aggregateTotalShippingCost,
      totalAmount: aggregateTotalAmount,
      orderDate: primaryOrder.order_date,
      orderStatus: primaryOrder.order_status,
      paymentStatus: 'PENDING',
      fulfillmentStatus: 'PENDING',
      createdAt: primaryOrder.created_at,
      updatedAt: primaryOrder.updated_at,
      orderItems: allOrderItems.map((item) => ({
        id: item.id,
        orderId: item.order_id,
        sellerId: item.seller_id,
        productId: item.product_Id,
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
      sellerOrders, // Include the individual seller orders
    };

    // Add exceptions to the response if any
    if (exceptions.length > 0) {
      result.exceptions = exceptions;
      result.status = 'PARTIAL';
    }

    return result;
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
          const productData = await this.productProxyService.getProduct(
            BigInt(product.productId),
          );

          if (productData) {
            const subtotal = productData.price * product.quantity;
            productsPricing.push({
              productId: product.productId,
              unitPrice: productData.price,
              quantity: product.quantity,
              subtotal,
            });
            productsTotal += subtotal;
            sellers.add(BigInt(productData.sellerId || 0));
          }
        } catch (error: any) {
          this.logger.warn({
            message: 'Failed to get product for shipping estimate',
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
      for (const sellerId of Array.from(sellers)) {
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

  /**
   * Process order transfers asynchronously after delivery
   * @param orderId - Order ID
   */
  private async processOrderTransfersAsync(orderId: bigint): Promise<void> {
    try {
      this.logger.info({
        message: 'Starting async fund transfer process',
        context: {
          operation: 'process_order_transfers_async',
          orderId: orderId.toString(),
        },
      });

      const transferResults = await this.paymentService.processOrderTransfers(
        orderId,
      );

      this.logger.info({
        message: 'Async fund transfer process completed',
        context: {
          operation: 'process_order_transfers_async',
          orderId: orderId.toString(),
          overallSuccess: transferResults.overallSuccess,
          sellerCount: transferResults.transfers.length,
          shipperTransferId: transferResults.shipperTransfer?.id,
        },
      });

      if (!transferResults.overallSuccess) {
        this.logger.warn({
          message: 'Some transfers failed during async processing',
          context: {
            operation: 'process_order_transfers_async',
            orderId: orderId.toString(),
            failedTransfers: transferResults.transfers.filter(
              (t) => !t.success,
            ),
          },
        });
      }
    } catch (error: any) {
      this.logger.error({
        message: 'Async fund transfer process failed',
        context: {
          operation: 'process_order_transfers_async',
          orderId: orderId.toString(),
          error: error.message,
        },
        error,
      });
    }
  }

  /**
   * Create payment intent for order after successful creation
   * @param orderResult - Order creation result
   * @param userId - User ID
   */
  private async createPaymentIntentForOrder(
    orderResult: OrderResponseDto,
    userId: bigint,
  ): Promise<void> {
    try {
      this.logger.info({
        message: 'Creating payment intent for order',
        context: {
          operation: 'create_payment_intent_for_order',
          userId: userId.toString(),
          totalAmount: orderResult.totalAmount,
          sellerOrderCount: orderResult.sellerOrders?.length || 0,
        },
      });

      // Calculate total amount in cents (PKR)
      const amountInCents = Math.round(orderResult.totalAmount * 100);

      // Create payment intent with escrow (application fee)
      const paymentIntent =
        await this.paymentService.createPaymentIntentWithEscrow(
          amountInCents,
          Math.round(amountInCents * 0.025), // 2.5% platform fee
          {
            destination: process.env.STRIPE_CONNECT_ACCOUNT_ID || '',
          },
          'pkr',
          {
            orderId: orderResult.id.toString(),
            userId: userId.toString(),
            sellerCount: orderResult.sellerOrders?.length?.toString() || '1',
            totalItems: orderResult.orderItems.length.toString(),
          },
        );

      this.logger.info({
        message: 'Payment intent created successfully for order',
        context: {
          operation: 'create_payment_intent_for_order',
          userId: userId.toString(),
          orderId: orderResult.id.toString(),
          paymentIntentId: paymentIntent.id,
          amount: amountInCents,
          platformFee: Math.round(amountInCents * 0.025),
        },
      });

      // Update order with payment intent ID (if you have a payment_intent_id field)
      // await this.updateOrderPaymentIntentId(orderResult.id, paymentIntent.id);
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to create payment intent for order',
        context: {
          operation: 'create_payment_intent_for_order',
          userId: userId.toString(),
          orderId: orderResult.id.toString(),
          error: error.message,
        },
        error,
      });
      // Don't throw error here to avoid breaking order creation
      // Payment can be handled separately
    }
  }

  /**
   * Handle payment failure and update order status
   * @param orderId - Order ID
   * @param paymentIntentId - Payment Intent ID
   * @param failureReason - Reason for payment failure
   */
  async handlePaymentFailure(
    orderId: bigint,
    paymentIntentId: string,
    failureReason: string,
  ): Promise<void> {
    try {
      this.logger.info({
        message: 'Handling payment failure for order',
        context: {
          operation: 'handle_payment_failure',
          orderId: orderId.toString(),
          paymentIntentId,
          failureReason,
        },
      });

      // Update order status to PaymentFailed
      await this.orderRepository.updateOrderStatus(
        orderId,
        'PAYMENT_FAILED',
        BigInt(1), // System user ID
      );

      // Update escrow status for order items
      await this.orderRepository.getPrisma().order_item.updateMany({
        where: {
          order_id: orderId,
        },
        data: {
          escrow_status: 'FAILED',
          payout_status: 'FAILED',
          updated_at: new Date(),
        },
      });

      this.logger.info({
        message: 'Order marked as payment failed',
        context: {
          operation: 'handle_payment_failure',
          orderId: orderId.toString(),
          paymentIntentId,
          failureReason,
        },
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to handle payment failure',
        context: {
          operation: 'handle_payment_failure',
          orderId: orderId.toString(),
          paymentIntentId,
          error: error.message,
        },
        error,
      });
      throw error;
    }
  }

  /**
   * Handle delivery confirmation and trigger fund transfers
   * @param orderId - Order ID
   * @param userId - User ID who confirmed delivery
   */
  async confirmDelivery(orderId: bigint, userId: bigint): Promise<void> {
    try {
      this.logger.info({
        message: 'Processing delivery confirmation',
        context: {
          operation: 'confirm_delivery',
          orderId: orderId.toString(),
          userId: userId.toString(),
        },
      });

      // Update order status to DELIVERED
      await this.updateOrderStatus(orderId, 'DELIVERED', userId);

      // The transfer logic is already handled in updateOrderStatus
      // when status is set to DELIVERED

      this.logger.info({
        message: 'Delivery confirmed and transfers initiated',
        context: {
          operation: 'confirm_delivery',
          orderId: orderId.toString(),
          userId: userId.toString(),
        },
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to confirm delivery',
        context: {
          operation: 'confirm_delivery',
          orderId: orderId.toString(),
          userId: userId.toString(),
          error: error.message,
        },
        error,
      });
      throw error;
    }
  }

  /**
   * Update seller/shipper onboarding status
   * @param userId - User ID
   * @param stripeAccountId - Stripe Account ID
   * @param onboardingStatus - Onboarding status
   */
  async updateOnboardingStatus(
    userId: bigint,
    stripeAccountId: string,
    onboardingStatus: 'PENDING' | 'COMPLETED' | 'FAILED',
  ): Promise<void> {
    try {
      this.logger.info({
        message: 'Updating user onboarding status',
        context: {
          operation: 'update_onboarding_status',
          userId: userId.toString(),
          stripeAccountId,
          onboardingStatus,
        },
      });

      // Update user's Stripe account status via auth-service
      await this.paymentService.updateUserStripeAccount(
        userId,
        stripeAccountId,
      );

      this.logger.info({
        message: 'User onboarding status updated successfully',
        context: {
          operation: 'update_onboarding_status',
          userId: userId.toString(),
          stripeAccountId,
          onboardingStatus,
        },
      });
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to update onboarding status',
        context: {
          operation: 'update_onboarding_status',
          userId: userId.toString(),
          stripeAccountId,
          onboardingStatus,
          error: error.message,
        },
        error,
      });
      throw error;
    }
  }
}
