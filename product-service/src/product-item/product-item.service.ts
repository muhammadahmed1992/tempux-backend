import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import ApiResponse from '@Helper/api-response';
import ResponseHelper from '@Helper/response-helper';
import Constants from '@Helper/constants';
import { ProductItemRepository } from './product-item.repository';
import { OrderSummaryRequestDTO } from '@DTO/order-summary-request.dto';
import {
  TaxLineItemDTO,
  OrderSummaryItemDTO,
  OrderSummaryDTO,
} from '@DTO/order-summary-response.dto';
@Injectable()
export class ProductItemService {
  constructor(private readonly repository: ProductItemRepository) {}
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
    return this.repository.checkIfStockAvailable(
      productId,
      product_items_Id,
      quantity,
    );
  }

  /**
   * This method prepares the order summary for the selected product(s) on the cart. Basically it just calculate total price, discount, taxes where applicable and shipping cost if any.
   * @param summary The request dto object which contains selected productId, itemId and the quantity
   * @returns Promise<ApiResponse<OrderSummaryDTO>>
   */
  async getOrderSummary(
    cartItems: OrderSummaryRequestDTO[],
  ): Promise<ApiResponse<OrderSummaryDTO>> {
    if (!cartItems || cartItems?.length === 0)
      throw new BadRequestException(
        "Cart is empty. Summary can't be calculated",
      );

    const uniqueItemIds = cartItems.map((i) => i.itemId);
    const itemsInfo = await this.repository.getProductItemsWithTax(
      uniqueItemIds,
    );

    if (itemsInfo.length !== uniqueItemIds.length) {
      throw new BadRequestException('One or more product items not found.');
    }

    const itemMap = new Map(itemsInfo.map((item) => [item.id, item]));
    const cartItemMap = new Map(
      cartItems.map((item) => [BigInt(item.itemId), item]),
    );

    // TODO: Later will move inside a stored procedure probably
    // Inventory Check
    let inventoryValidation = [];
    for (const item of itemsInfo) {
      const requestedItem = cartItemMap.get(item.id);
      if (requestedItem!.quantity > item.quantity)
        inventoryValidation.push(
          `Only stocks of ${item.quantity} is available for ${item.id}`,
        );
    }
    if (inventoryValidation.length) {
      throw new BadRequestException(inventoryValidation);
    }

    let totalSubtotal = 0;
    let totalDiscount = 0;
    const taxMap = new Map<string, number>();
    const summaryItems: OrderSummaryItemDTO[] = [];

    for (const cartItem of cartItems) {
      const item = itemMap.get(cartItem.itemId)!;
      const currency = item.currency;
      const currencyRate = currency?.exchangeRate?.toFixed(2) || 1;
      const price = item.price.toFixed(2) * currencyRate;
      const discount = item.discount.toFixed(2) * currencyRate;

      const taxRate = item.tax?.taxRate.toFixed(2) || 0 * currencyRate;
      const taxName = item.tax?.description || 'N/A';

      const itemSubtotal = (price - discount) * cartItem.quantity;
      const itemTaxAmount = itemSubtotal * taxRate;
      const itemTotal = itemSubtotal + itemTaxAmount;

      totalSubtotal += itemSubtotal * currencyRate;
      totalDiscount += discount * cartItem.quantity;

      const currentTaxAmount = taxMap.get(taxName) || 0;
      taxMap.set(taxName, currentTaxAmount + itemTaxAmount);

      summaryItems.push({
        symb: currency?.curr || '$',
        productId: cartItem.productId,
        itemId: item.id,
        quantity: cartItem.quantity,
        price: price,
        discount: discount,
        subtotal: itemSubtotal,
        taxAmount: itemTaxAmount,
        taxName: taxName,
        total: itemTotal,
      });
    }

    const taxSummary: TaxLineItemDTO[] = Array.from(
      taxMap,
      ([taxName, amount]) => ({
        taxName: taxName,
        amount: amount,
      }),
    );

    const totalTax = taxSummary.reduce((sum, tax) => sum + tax.amount, 0);
    const grandTotal = totalSubtotal + totalTax;

    return ResponseHelper.CreateResponse<OrderSummaryDTO>(
      '',
      {
        items: summaryItems,
        subtotal: totalSubtotal,
        totalDiscount: totalDiscount,
        taxSummary: taxSummary,
        grandTotal: grandTotal,
      },
      HttpStatus.OK,
    );
  }
}
