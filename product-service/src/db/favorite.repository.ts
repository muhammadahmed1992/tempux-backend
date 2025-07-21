import { Injectable } from "@nestjs/common";
import { Prisma, PrismaClient, favorite } from "@prisma/client";
import { BaseRepository } from "./base.repository";
import { PrismaService } from "@Services/prisma.service";

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
    itemId: bigint
  ) {
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
      },
      select: {
        id: true,
      },
    });
  }
  /**
   * This method will be un marking or removing the product from Favorite. But it will only updated the isDelete flag won't remove permanently.
   * @param userId Id of the user which is marking the product as favorite
   * @param productId Parent Id of the currently selected/marked product variant
   * @param itemId Specific Id of that particular variant
   */
  async markProductAsUnFavorite(
    userId: bigint,
    productId: bigint,
    itemId: bigint
  ) {
    return this.model.update({
      where: {
        user_id_product_id_product_variant_id: {
          user_id: userId,
          product_id: productId,
          product_variant_id: itemId,
        },
      },
      data: {
        is_deleted: true,
        deleted_at: new Date(),
        deleted_by: userId,
        updated_at: new Date(),
        updated_by: userId,
      },
      select: {
        id: true,
      },
    });
  }
}
