import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, favorite } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { PrismaService } from '@Services/prisma.service';

@Injectable()
export class FavoriteRepository extends BaseRepository<
  favorite,
  Prisma.favoriteCreateInput,
  Prisma.favoriteUpdateInput,
  Prisma.favoriteWhereUniqueInput,
  Prisma.favoriteWhereInput,
  Prisma.favoriteFindUniqueArgs,
  Prisma.favoriteFindManyArgs,
  Prisma.favoriteFindFirstArgs
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, prisma.favorite);
  }
  /**
   *
   * @param userId Id of the user which is marking the product as favorite
   * @param productId Parent Id of the currently selected/marked product variant
   * @param itemId Specific Id of that particular variant
   */
  async markProductAsFavorite(
    userId: bigint,
    productId: bigint,
    itemId: bigint,
    flag: boolean,
  ) {
    return this.prisma.favorite.upsert({
      where: {
        user_id_product_id_product_variant_id: {
          user_id: userId,
          product_id: productId,
          product_variant_id: itemId,
        },
      },
      update: flag
        ? {
            is_deleted: false,
            deleted_at: null,
            deleted_by: null,
            updated_at: new Date(),
            updated_by: userId,
          }
        : {
            is_deleted: true,
            deleted_at: new Date(),
            deleted_by: userId,
            updated_at: new Date(),
            updated_by: userId,
          },
      create: {
        user_id: userId,
        product: {
          connect: { id: productId },
        },
        product_variant: {
          connect: { id: itemId },
        },
        is_deleted: !flag,
        deleted_at: !flag ? new Date() : null,
        deleted_by: !flag ? userId : null,
        created_by: userId,
      },
      select: {
        id: true,
      },
    });
  }
}
