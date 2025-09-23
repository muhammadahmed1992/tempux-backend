import { Injectable } from '@nestjs/common';
import { Prisma, product } from '@prisma/client';
import { BaseRepository } from '@Common/db/base.repository';
import { PrismaService } from '@Prisma/prisma.service';

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

  /**
   * @param userId It is an optional parameter if user is authenticated.
   * @param productId It is the main productId to fetch it's summary. Also it returns the color in asending order so that the   details can be fetched sequentially in order to enhance the performance.
   * @returns product summary with price, discount, item, images and average ratings
   */
  async getProductSummary(userId: bigint | null, productId: bigint) {
    return this.model.findUnique({
      where: {
        id: productId,
      },
      select: {
        name: true,
        title: true,
        description: true,
        model: {
          select: {
            id: true,
            title: true,
            brand_id: true,
            brand: {
              select: {
                title: true,
                image_url: true,
              },
            },
          },
        },
        brand: {
          select: {
            id: true,
            title: true,
            image_url: true,
          },
        },
        sales_price: true,
        id: true,
        quantity: true,
        discount: true,
        sku: true,
        serial_number: true,
        reference_number: true,
        year_of_production: true,
        is_used: true,
        currency: {
          select: {
            curr: true,
            exchangeRate: true,
          },
        },
        size: {
          select: {
            caseWidth: true,
            caseHeight: true,
            widthUnit: true,
            heightUnit: true,
          },
        },
        caseMaterial: {
          select: {
            id: true,
            title: true,
          },
        },
        braceletMaterial: {
          select: {
            id: true,
            title: true,
          },
        },
        crystalType: {
          select: {
            id: true,
            title: true,
          },
        },
        complication: {
          select: {
            id: true,
            title: true,
          },
        },
        productImages: {
          select: {
            id: true,
            img_url: true,
            alt_text: true,
            order: true,
            type: true,
            image_type: true,
          },
          where: {
            is_deleted: false,
          },
          orderBy: {
            order: 'asc',
          },
        },
        productReviews: {
          select: {
            ratings: true,
          },
          where: {
            is_deleted: false, // Only consider active reviews
          },
        },
        attributeValues: {
          select: {
            string_value: true,
            number_value: true,
            boolean_value: true,
            date_value: true,
            lookup_name: true,
            lookup_id: true,
            attributeCategoryMapping: {
              select: {
                attribute: {
                  select: {
                    name: true,
                    display_name: true,
                    unit: true,
                  },
                },
                attributeCategory: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          where: {
            is_deleted: false,
          },
        },
        productFavorite: userId
          ? {
              where: {
                user_id: userId,
                is_deleted: false,
              },
              select: {
                id: true,
              },
            }
          : false,
      },
    });
  }
    /**
   * This method will returns the price, discount & tax information against particular item
   * @param product_items_Id[] specific item id which is going to check
   * @returns Returns the product_items entit(ies) against id(s)
   */
  async getProductWithTax(product_items_Ids: bigint[]): Promise<any[]> {
    return this.model.findMany({
      where: {
        id: {
          in: product_items_Ids,
        },
      },
      select: {
        id: true,
        sales_price: true,
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
