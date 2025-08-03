import { Injectable } from '@nestjs/common';
import { Prisma, cart } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { AddToCartRequestDTO } from '@DTO/add-to-cart-request.dto';
import { RemoveCartItemRequestDTO } from '@DTO/remove-cart-request.dto';
import { PrismaService } from '../services/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {
    super(prisma, prisma.cart);
  }
  /**
   * This method will add product in cart table by user
   * @param userId Id of the user which is marking the product as favorite
   * @param productId Parent Id of the currently selected/marked product variant
   * @param itemId Specific Id of that particular variant
   */
  async addProductInCart(create: AddToCartRequestDTO) {
    return this.prisma.cart.upsert({
      where: {
        user_id_product_id_product_variant_id: {
          user_id: create.userId,
          product_id: create.productId,
          product_variant_id: create.itemId,
        },
      },
      update: {
        quantity: create.quantity,
        updated_at: new Date(),
        updated_by: create.userId,
      },
      create: {
        user_id: create.userId,
        product: {
          connect: {
            id: create.productId,
          },
        },
        product_variant: {
          connect: {
            id: create.itemId,
          },
        },
        quantity: create.quantity,
        created_by: create.userId,
        created_at: new Date(),
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
  async removeFromCart(
    userId: bigint,
    items: RemoveCartItemRequestDTO[],
  ): Promise<{ count: number }> {
    if (!items.length) return { count: 0 };

    const orConditions = items.map((item) => ({
      user_id: userId,
      product_id: item.productId,
      product_variant_id: item.product_variant_Id,
    }));
    console.log(`printing the orCondition for debugging`);
    console.log(orConditions);
    return this.prisma.cart.deleteMany({
      where: {
        OR: orConditions,
      },
    });
  }

  /**
   * Fetches cart detailed information of a user..
   *
   * @param userId The ID of the user (BigInt).
   * @param page This is the current page number and by default it is 1
   * @param pageSize This is the current pageSize by default it is 100000
   * @returns The Product Title, Name, Reference Color Size Quantity, Price, CartId to remove if needed.
   */
  async getCartDetailedInfomration(
    userId: bigint,
    page: number,
    pageSize: number,
    where?: object,
    select?: object,
    order?: object,
  ): Promise<{ data: any[]; totalCount: number }> {
    // Fetch all cart information for the user

    const { data, totalCount } = await this.findManyPaginated(
      page,
      pageSize,
      {
        user_id: userId,
        is_deleted: false,
      },
      {
        id: true,
        quantity: true,
        product_variant: {
          select: {
            id: true,
            price: true,
            base_image_url: true,
            color: {
              select: {
                name: true,
              },
            },
            size: {
              select: {
                value: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                title: true,
                reference_number: true,
              },
            },
          },
        },
      },
      order,
    );
    return { data, totalCount };
  }
}
