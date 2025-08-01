import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ProductIdResolver } from '@Resolvers/product-id.resolver';

@Injectable()
export class ParseAddToAnalyticsPipe implements PipeTransform {
  constructor(private readonly productIdResolver: ProductIdResolver) {}

  async transform(value: any): Promise<any> {
    const { productId, product_variant_Id } = value;

    if (typeof productId !== 'string') {
      throw new BadRequestException('Product ID must be a string.');
    }
    const decodedProductId = this.productIdResolver.resolve(productId);
    const dtoInstance = {
      productId: decodedProductId,
      product_variant_Id: product_variant_Id,
    };
    return dtoInstance;
  }
}
