import { AddToCartRequestDTO } from '@DTO/add-to-cart-request.dto';
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ProductIdResolver } from '@Resolvers/product-id.resolver';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ParseAddToCartPipe implements PipeTransform {
  constructor(private readonly productIdResolver: ProductIdResolver) {}

  async transform(value: any): Promise<any> {
    const { productId, product_variant_Id, quantity, userId } = value;

    if (typeof productId !== 'string') {
      throw new BadRequestException('Product ID must be a string.');
    }
    const decodedProductId = this.productIdResolver.resolve(productId);
    const dtoInstance: AddToCartRequestDTO = {
      productId: decodedProductId,
      product_variant_Id: product_variant_Id,
      quantity: quantity,
      userId: userId,
    };
    return dtoInstance;
  }
}
