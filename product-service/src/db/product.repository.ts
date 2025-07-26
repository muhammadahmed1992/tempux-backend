import { Injectable } from '@nestjs/common';
import { Prisma, product } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { PrismaService } from '@Services/prisma.service';

@Injectable()
export class ProductRepository extends BaseRepository<
  product,
  Prisma.productCreateInput,
  Prisma.productUpdateInput,
  Prisma.productWhereUniqueInput,
  Prisma.productWhereInput,
  Prisma.productFindUniqueArgs,
  Prisma.productFindManyArgs,
  Prisma.productFindFirstArgs
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, prisma.product);
  }

  async getProductSummary(productId: bigint) {
    return this.model.findUnique({
      where: {
        id: productId,
      },
      include: {
        productReviews: {
          select: {
            ratings: true,
          },
          where: {
            is_deleted: false, // Only consider active reviews
          },
        },
        productVariants: {
          select: {
            price: true,
            id: true,
            quantity: true,
            currency: {
              select: {
                curr: true,
                exchangeRate: true,
              },
            },
            color: {
              // Main product color (e.g., case color)
              select: {
                id: true,
                name: true,
                colorCode: true,
              },
            },
            image: {
              select: {
                img_url: true,
                alt_text: true,
                order: true,
                color_id: true,
                size_id: true,
              },
              where: {
                is_deleted: false,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
          where: {
            is_deleted: false,
          },
        },
      },
    });
  }
}
