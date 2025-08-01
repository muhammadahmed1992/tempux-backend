import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import ApiResponse from '@Helper/api-response';
import ResponseHelper from '@Helper/response-helper';
import Constants from '@Helper/constants';
import { ProductVariantRepository } from '@Repository/product-variant.repository';
import { OrderSummaryRequestDTO } from '@DTO/order-summary-request.dto';
@Injectable()
export class ProductVariantService {
  constructor(private readonly repository: ProductVariantRepository) {}
  async getAllPagedData(
    pageNumber: number,
    pageSize: number,
    order?: object,
    where?: object,
    select?: object,
    include?: object,
  ): Promise<ApiResponse<any>> {
    const { data, totalCount } = await this.repository.findManyPaginated(
      pageNumber,
      pageSize,
      where,
      select,
      order,
      include,
    );
    return ResponseHelper.CreateResponse<any>(
      Constants.DATA_SUCCESS,
      data,
      HttpStatus.OK,
      {
        pageNumber,
        pageSize,
        totalCount,
        numberOfTotalPages: Math.ceil(totalCount / pageSize),
      },
    );
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
    return this.repository.checkIfStockAvailable(
      productId,
      product_variant_Id,
      quantity,
    );
  }

  /**
   * This method prepares the order summary for the selected product(s) on the cart. Basically it just calculate total price, discount, taxes where applicable and shipping cost if any.
   * @param summary The request dto object which contains selected productId, variantId and the quantity
   * @returns Promise<ApiResponse<OrderSummaryDTO>>
   */
  async getOrderSummary(summary: OrderSummaryRequestDTO[]) {
    if (!summary || summary?.length === 0)
      throw new BadRequestException(
        "Cart is empty. Summary can't be calculated",
      );

    const uniqueVariants = summary.map((s) => s.product_variant_Id);
    const variantsInfo = await this.repository.getProductVariantsWithTax(
      uniqueVariants,
    );

    if (variantsInfo.length !== uniqueVariants.length) {
      throw new BadRequestException('One or more product variants not found.');
    }

    const variantMap = new Map(
      variantsInfo.map((variant) => [variant.id, variant]),
    );
    const cartItemMap = new Map(
      summary.map((item) => [item.product_variant_Id, item]),
    );

    // TODO: Later will move inside a stored procedure probably
    // Inventory Check
    let inventoryValidation = [];
    for (const variant of variantsInfo) {
      const requestedItem = cartItemMap.get(variant.id);
      if (requestedItem!.quantity > variant.quantity)
        inventoryValidation.push(
          `Only stocks of ${variant.quantity} is available for ${variant.id}`,
        );
    }
    if (inventoryValidation.length) {
      throw new BadRequestException(inventoryValidation);
    }

    let totalSubtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    const summaryItems = [];

    for (const cartItem of summary) {
      const variant = variantMap.get(cartItem.product_variant_Id);

      const price = variant?.price;
      const discount = variant?.discount;
      const taxRate = variant?.tax?.taxRate || 0;

      const itemSubtotal = (price - discount) * cartItem.quantity;
      const itemTaxAmount = itemSubtotal * taxRate;
      const itemTotal = itemSubtotal + itemTaxAmount;

      totalSubtotal += itemSubtotal;
      totalDiscount += discount * cartItem.quantity;
      totalTax += itemTaxAmount;

      summaryItems.push({
        productId: cartItem.productId,
        product_variant_Id: BigInt(variant.id),
        quantity: cartItem.quantity,
        price: price,
        discount: discount,
        subtotal: itemSubtotal,
        taxAmount: itemTaxAmount,
        total: itemTotal,
      });
    }

    return {
      items: summaryItems,
      subtotal: totalSubtotal,
      totalDiscount: totalDiscount,
      totalTax: totalTax,
      grandTotal: totalSubtotal + totalTax,
    };
  }
}
