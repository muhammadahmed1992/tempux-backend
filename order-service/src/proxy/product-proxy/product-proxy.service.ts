import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductProxyService {
  async getProductVariant(variantId: bigint): Promise<any> {
    // This would call the product service to get variant details
    // For now, returning a mock response
    return {
      id: variantId,
      quantity: 10,
      price: 99.99,
    };
  }
}
