import { Injectable } from '@nestjs/common';
import { Prisma, order_item_shipment, shipment_provider } from '@prisma/client';
import { BaseRepository } from '../common/db/base.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShipmentRepository extends BaseRepository<
  order_item_shipment,
  Prisma.order_item_shipmentCreateInput,
  Prisma.order_item_shipmentUpdateInput,
  Prisma.order_item_shipmentWhereUniqueInput,
  Prisma.order_item_shipmentWhereInput,
  Prisma.order_item_shipmentFindUniqueArgs,
  Prisma.order_item_shipmentFindManyArgs,
  Prisma.order_item_shipmentFindFirstArgs
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, prisma.order_item_shipment);
  }

  async createShipmentForOrderItem(
    orderItemId: bigint,
    shipmentData: {
      shipmentId: bigint;
      shipmentCost: number;
      trackingId: string;
      createdBy: bigint;
    },
  ): Promise<order_item_shipment> {
    return this.create({
      order_item_id: orderItemId,
      shipment_id: shipmentData.shipmentId,
      shipment_cost: shipmentData.shipmentCost,
      shipment_status: 'PENDING',
      tracking_id: shipmentData.trackingId,
      created_by: shipmentData.createdBy,
    });
  }

  async getShipmentsByOrderId(orderId: bigint): Promise<order_item_shipment[]> {
    return this.findMany({
      where: {
        order_item: {
          order_id: orderId,
          is_deleted: false,
        },
      },
      include: {
        shipment: true,
      },
    });
  }

  async updateShipmentStatus(
    shipmentId: bigint,
    status: string,
    updatedBy: bigint,
  ): Promise<order_item_shipment> {
    return this.update(
      { id: shipmentId },
      {
        shipment_status: status,
        updated_by: updatedBy,
        updated_at: new Date(),
      },
    );
  }

  async getFedExProvider(): Promise<shipment_provider | null> {
    return this.prisma.shipment_provider.findFirst({
      where: {
        name: 'FEDEX',
        is_deleted: false,
      },
    });
  }
}
