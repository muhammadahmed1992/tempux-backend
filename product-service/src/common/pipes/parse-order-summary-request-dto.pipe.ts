import { ProductIdResolver } from '@Common/resolver/product-id.resolver';
import { OrderSummaryRequestDTO } from '@DTO/order-summary-request.dto';
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseOrderSummaryPipe implements PipeTransform {
  constructor(private readonly productIdResolver: ProductIdResolver) {}

  async transform(
    value: OrderSummaryRequestDTO[],
  ): Promise<OrderSummaryRequestDTO[]> {
    if (!Array.isArray(value)) {
      throw new BadRequestException('Request body must be an array.');
    }

    const transformedItems: OrderSummaryRequestDTO[] = [];
    for (const item of value) {
      if (typeof item.productId !== 'string') {
        throw new BadRequestException(
          "Each item's productId must be a string.",
        );
      }

      const decodedProductId = this.productIdResolver.resolve(item.productId);

      // Create a plain object with the decoded ID
      const dtoInstance: OrderSummaryRequestDTO = {
        productId: decodedProductId,
        product_variant_Id: item.product_variant_Id,
        quantity: item.quantity,
      };

      transformedItems.push(dtoInstance);
    }

    return transformedItems;
  }
}
