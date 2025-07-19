import { Injectable } from "@nestjs/common";
import { Prisma, PrismaClient, cart } from "@prisma/client";
import { BaseRepository } from "./base.repository";
import { AddToCartRequestDTO } from "@DTO/add.to.cart.request.dto";
import { RemoveCartItemRequestDTO } from "@DTO/remove.cart.request.dto";

@Injectable()
export class CartRepository extends BaseRepository<
  cart,
  Prisma.cartCreateInput,
  Prisma.cartUpdateInput,
  Prisma.cartWhereUniqueInput,
  Prisma.cartWhereInput,
  Prisma.cartFindUniqueArgs,
  Prisma.cartFindManyArgs,
  Prisma.cartFindFirstArgs
> {
  constructor(private readonly prisma: PrismaClient) {
    super(prisma, prisma.cart);
  }
  /**
   * This method will add product in cart table by user
   * @param userId Id of the user which is marking the product as favorite
   * @param productId Parent Id of the currently selected/marked product variant
   * @param itemId Specific Id of that particular variant
   */
  async addProductInCart(create: AddToCartRequestDTO) {
    return this.model.create({
      data: {
        user_id: create.userId,
        product: {
          connect: {
            id: create.productId,
          },
        },
        product_variant: {
          connect: {
            id: create.product_variant_Id,
          },
        },
        created_by: create.userId,
        quantity: create.quantity,
      },
      select: {
        id: true,
      },
    });
  }
  /**
   * This method will be un marking or removing the product from Cart. But it will only updated the isDelete flag, won't remove permanently.
   * @param userId Id of the user which is marking the product as favorite
   * @param productId Parent Id of the currently selected/marked product variant
   * @param itemId Specific Id of that particular variant
   */
  async removeFromCart(remove: RemoveCartItemRequestDTO) {
    return this.model.update({
      where: {
        user_id_product_id_product_variant_id: {
          user_id: remove.userId,
          product_id: remove.productId,
          product_variant_id: remove.product_variant_Id,
        },
      },
      data: {
        is_deleted: true,
        deleted_at: new Date(),
        deleted_by: remove.userId,
        updated_at: new Date(),
        updated_by: remove.userId,
      },
      select: {
        id: true,
      },
    });
  }
}
