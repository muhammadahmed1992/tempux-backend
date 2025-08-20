// src/common/pipes/parse-product-id.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ProductIdResolver } from '@Resolvers/product-id.resolver';

@Injectable()
export class ParseProductIdPipe implements PipeTransform<string, bigint> {
  constructor(private readonly productIdResolver: ProductIdResolver) {}

  transform(value: string): bigint {
    if (!value) {
      throw new BadRequestException('Product ID is required');
    }
    return this.productIdResolver.resolve(value);
  }
}
