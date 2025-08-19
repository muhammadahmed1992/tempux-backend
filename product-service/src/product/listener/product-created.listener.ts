import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductCreatedEvent } from '../event/product-created.event';

@Injectable()
export class ProductCreatedListener {
  private readonly logger = new Logger(ProductCreatedListener.name);

  constructor(private prisma: PrismaService) {}

  @OnEvent('product.created', { async: true })
  async handleProductCreated(event: ProductCreatedEvent) {
    this.logger.log(`Tagging product ${event.productId} as NEW_ARRIVAL`);
    // TODO: Will GRAB NEW_ARRIVAL value from global configuration..

    await this.prisma.product_tag.create({
      data: {
        product_id: Number(event.productId),
        tag_id: 1, // assume NEW_ARRIVAL tag has ID=1
        created_by: event.userId,
      },
    });
  }
}
