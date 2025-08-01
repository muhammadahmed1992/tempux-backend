import { Injectable } from '@nestjs/common';
import { Prisma, product_variants } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { PrismaService } from '@Services/prisma.service';

@Injectable()
export class ProductVariantRepository extends BaseRepository<
  product_variants,
  Prisma.product_variantsCreateInput,
  Prisma.product_variantsUpdateInput,
  Prisma.product_variantsWhereUniqueInput,
  Prisma.product_variantsWhereInput,
  Prisma.product_variantsFindUniqueArgs,
  Prisma.product_variantsFindManyArgs,
  Prisma.product_variantsFindFirstArgs
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, prisma.product_variants);
  }

  /**
   * @param productId Parent productId for specific product variant
   * @param product_variant_Id specific variant id which is going to check
   * @param quantity Total.no.of quantity to be check if exists in stock/inventory
   * @returns bolean. Return true/false depending upon the existance of the product & variant for particular quantity
   */
  async checkIfStockAvailable(
    productId: bigint,
    product_variant_Id: bigint,
    quantity: number,
  ): Promise<boolean> {
    const result = await this.model.findFirst({
      where: {
        product: {
          id: productId,
        },
        id: product_variant_Id,
        quantity,
      },
      select: {
        id: true,
      },
    });
    if (result && result?.id) return true;
    return false;
  }

  /**
   * This method will returns the price, discount & tax information against particular variant
   * @param product_variant_Id[] specific variant id which is going to check
   * @returns Returns the product_variant entit(ies) against id(s)
   */
  async getProductVariantsWithTax(
    product_variant_Ids: bigint[],
  ): Promise<any[]> {
    return this.model.findMany({
      where: {
        id: {
          in: product_variant_Ids,
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
      },
    });
  }
}
