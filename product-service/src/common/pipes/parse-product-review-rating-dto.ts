import { ProductRatingReviewDTO } from '@DTO/product-rating-reviews';
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ProductIdResolver } from '@Resolvers/product-id.resolver';

@Injectable()
export class ParseProductReviewRatingtPipe implements PipeTransform {
  constructor(private readonly productIdResolver: ProductIdResolver) {}

  async transform(value: any): Promise<any> {
    const { productId, review, ratings } = value;

    if (typeof productId !== 'string') {
      throw new BadRequestException('Product ID must be a string.');
    }
    const decodedProductId = this.productIdResolver.resolve(productId);
    const dtoInstance: ProductRatingReviewDTO = {
      productId: decodedProductId,
      review,
      ratings,
    };
    return dtoInstance;
  }
}
