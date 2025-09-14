import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, favorite } from '@prisma/client';
import { BaseRepository } from '@Common/db/base.repository';
import { PrismaService } from '@Prisma/prisma.service';

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
   * @param productId Parent Id of the currently selected/marked product item
   * @param itemId Specific Id of that particular item
   * @return
   */
  async markProductAsFavorite(
    userId: bigint,
    productId: bigint,
    itemId: bigint,
    flag: boolean,
  ) {
    return this.prisma.favorite.upsert({
      where: {
        user_id_product_id_product_item_id: {
          user_id: userId,
          product_id: productId,
          product_item_id: itemId,
        },
      },
      create: {
        user_id: userId,
        product: {
          connect: {
            id: productId,
          },
        },
        product_item: {
          connect: {
            id: itemId,
          },
        },
        created_by: userId,
        created_at: new Date(),
      },
      update: {
        user_id: userId,
        product: {
          connect: {
            id: productId,
          },
        },
        product_item: {
          connect: {
            id: itemId,
          },
        },
        updated_by: userId,
        updated_at: new Date(),
        is_deleted: !flag,
      },
    });
  }
}
