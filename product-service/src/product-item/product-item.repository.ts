import { Injectable } from '@nestjs/common';
import { Prisma, product_items } from '@prisma/client';
import { BaseRepository } from '@Common/db/base.repository';
import { PrismaService } from '@Prisma/prisma.service';

@Injectable()
export class ProductItemRepository extends BaseRepository<
  product_items,
  Prisma.product_itemsCreateInput,
  Prisma.product_itemsUpdateInput,
  Prisma.product_itemsWhereUniqueInput,
  Prisma.product_itemsWhereInput,
  Prisma.product_itemsFindUniqueArgs,
  Prisma.product_itemsFindManyArgs,
  Prisma.product_itemsFindFirstArgs
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, prisma.product_items);
  }

  /**
   * @param productId Parent productId for specific product item
   * @param product_items_Id specific item id which is going to check
   * @param quantity Total.no.of quantity to be check if exists in stock/inventory
   * @returns bolean. Return true/false depending upon the existance of the product & item for particular quantity
   */
  async checkIfStockAvailable(
    productId: bigint,
    product_items_Id: bigint,
    quantity: number,
  ): Promise<boolean> {
    const result = await this.model.findFirst({
      where: {
        product: {
          id: productId,
        },
        id: product_items_Id,
        quantity: {
          gte: quantity,
        },
      },
      select: {
        quantity: true,
      },
    });
    if (result && result.quantity > 0) return true;
    return false;
  }

  /**
   * This method will returns the price, discount & tax information against particular item
   * @param product_items_Id[] specific item id which is going to check
   * @returns Returns the product_items entit(ies) against id(s)
   */
  async getProductItemsWithTax(product_items_Ids: bigint[]): Promise<any[]> {
    return this.model.findMany({
      where: {
        id: {
          in: product_items_Ids,
        },
      },
      select: {
        id: true,
        price: true,
        discount: true,
        tax: {
          select: {
            description: true,
            taxRate: true,
          },
        },
        currency: {
          select: {
            curr: true,
            exchangeRate: true,
          },
        },
      },
    });
  }
}
