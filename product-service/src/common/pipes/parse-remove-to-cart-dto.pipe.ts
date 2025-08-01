// src/common/pipes/parse-remove-cart-item.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ProductIdResolver } from '@Resolvers/product-id.resolver';
import { RemoveCartItemRequestDTO } from '@DTO/remove-cart-request.dto';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ParseRemoveCartItemPipe
  implements PipeTransform<any, Promise<RemoveCartItemRequestDTO[]>>
{
  constructor(private readonly productIdResolver: ProductIdResolver) {}

  async transform(value: any): Promise<RemoveCartItemRequestDTO[]> {
    if (!Array.isArray(value)) {
      throw new BadRequestException('Request body must be an array.');
    }

    const transformedItems = [];
    for (const item of value) {
      if (typeof item.productId !== 'string') {
        throw new BadRequestException(
          "Each item's productId must be a string.",
        );
      }

      const decodedProductId = this.productIdResolver.resolve(item.productId);

      // Create a plain object with the decoded ID
      const plainObject: RemoveCartItemRequestDTO = {
        productId: decodedProductId,
        product_variant_Id: item.product_variant_Id,
      };

      transformedItems.push(plainObject);
    }

    return Promise.resolve(transformedItems);
  }
}
