import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOrderWithItems(
    orderData: Prisma.ordersCreateInput,
    orderItemsData: Omit<Prisma.order_itemUncheckedCreateInput, 'order_id'>[],
  ): Promise<{ order: any; orderItems: any[] }> {
    const order = await this.prisma.orders.create({
      data: orderData,
    });

    const orderItems = await Promise.all(
      orderItemsData.map((itemData) =>
        this.prisma.order_item.create({
          data: {
            ...itemData,
            order_id: order.id,
          },
        }),
      ),
    );

    return { order, orderItems };
  }

  async createOrderWithItemsInTransaction(
    orderData: Prisma.ordersCreateInput,
    orderItemsData: Omit<Prisma.order_itemUncheckedCreateInput, 'order_id'>[],
    tx: any, // Prisma transaction object
  ): Promise<{ order: any; orderItems: any[] }> {
    const order = await tx.orders.create({
      data: orderData,
    });

    const orderItems = await Promise.all(
      orderItemsData.map((itemData) =>
        tx.order_item.create({
          data: {
            ...itemData,
            order_id: order.id,
          },
        }),
      ),
    );

    return { order, orderItems };
  }

  async getOrderWithItems(orderId: bigint): Promise<any> {
    return this.prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        order_items: true,
      },
    });
  }

  async getOrdersByBuyerId(
    buyerId: bigint,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<{ data: any[]; totalCount: number }> {
    const skip = (page - 1) * pageSize;

    const [data, totalCount] = await Promise.all([
      this.prisma.orders.findMany({
        where: { buyer_id: buyerId },
        skip,
        take: pageSize,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.orders.count({
        where: { buyer_id: buyerId },
      }),
    ]);

    return { data, totalCount };
  }

  async updateOrderStatus(
    orderId: bigint,
    status: string,
    userId: bigint,
  ): Promise<any> {
    return this.prisma.orders.update({
      where: { id: orderId },
      data: {
        order_status: status,
        updated_by: userId,
        updated_at: new Date(),
      },
    });
  }

  // Multi-seller order creation within transaction
  async createMultiSellerOrdersInTransaction(
    ordersData: Array<{
      orderData: Prisma.ordersCreateInput;
      orderItemsData: Omit<Prisma.order_itemUncheckedCreateInput, 'order_id'>[];
    }>,
    tx: any, // Prisma transaction object
  ): Promise<Array<{ order: any; orderItems: any[] }>> {
    const results = [];

    for (const { orderData, orderItemsData } of ordersData) {
      const order = await tx.orders.create({
        data: orderData,
      });

      const orderItems = await Promise.all(
        orderItemsData.map((itemData) =>
          tx.order_item.create({
            data: {
              ...itemData,
              order_id: order.id,
            },
          }),
        ),
      );

      results.push({ order, orderItems });
    }

    return results;
  }

  // Expose prisma for transaction access
  getPrisma() {
    return this.prisma;
  }
}
