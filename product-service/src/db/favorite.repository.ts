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
   * @return
   */
  async markProductAsFavorite(
    userId: bigint,
    productId: bigint,
    itemId: bigint,
    flag: boolean,
  ) {
    console.log(flag);
    if (flag) {
      return this.model.create({
        data: {
          user_id: userId,
          product: {
            connect: {
              id: productId,
            },
          },
          product_variant: {
            connect: {
              id: itemId,
            },
          },
          created_by: userId,
          created_at: new Date(),
        },
      });
    } else {
      return this.model.delete({
        where: {
          user_id_product_id_product_variant_id: {
            user_id: userId,
            product_id: productId,
            product_variant_id: itemId,
          },
        },
      });
    }
  }
}
