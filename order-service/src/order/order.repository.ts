import { Injectable } from '@nestjs/common';
import { Prisma, orders, order_item } from '@prisma/client';
import { BaseRepository } from '../common/db/base.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderRepository extends BaseRepository<
  orders,
  Prisma.ordersCreateInput,
  Prisma.ordersUpdateInput,
  Prisma.ordersWhereUniqueInput,
  Prisma.ordersWhereInput,
  Prisma.ordersFindUniqueArgs,
  Prisma.ordersFindManyArgs,
  Prisma.ordersFindFirstArgs
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, prisma.orders);
  }

  async createOrderWithItems(
    orderData: Prisma.ordersCreateInput,
    orderItemsData: Prisma.order_itemCreateInput[],
  ): Promise<{ order: orders; orderItems: order_item[] }> {
    return this.prisma.$transaction(async (tx) => {
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
    });
  }

  async getOrderWithItems(
    orderId: bigint,
  ): Promise<(orders & { orderItems: order_item[] }) | null> {
    return this.model.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          where: { is_deleted: false },
        },
      },
    });
  }

  async getOrdersByBuyerId(
    buyerId: bigint,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<{ data: orders[]; totalCount: number }> {
    return this.findManyPaginated(
      page,
      pageSize,
      { buyer_id: buyerId },
      undefined,
      { order_date: 'desc' },
    );
  }

  async updateOrderStatus(
    orderId: bigint,
    status: string,
    updatedBy: bigint,
  ): Promise<orders> {
    return this.update(
      { id: orderId },
      {
        order_status: status,
        updated_by: updatedBy,
        updated_at: new Date(),
      },
    );
  }
}

