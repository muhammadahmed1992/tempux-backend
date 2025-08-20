import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, catchError } from 'rxjs';
import { AxiosResponse } from 'axios';

// Define a simple interface for the user data you expect from the User Service
export interface UserDetails {
  email: string;
  name: string;
  fullName: string;
}

@Injectable()
export class ProductProxyService {
  private readonly productSvcUrl: string;
  // TODO: Need to implement logging...

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.productSvcUrl = this.configService.getOrThrow<string>(
      'PRODUCT_SERVICE_URL',
    );
    if (!this.productSvcUrl) {
      // TODO: Need to implement logging...
      throw new InternalServerErrorException(
        'Product Service URL not configured in the environment.',
      );
    }
  }

  /**
   * Post the completed product details to Product Service, for calculating 'Best Seller' tag and mark them 'Best Seller' If needed.
   * Uses a POST request to handle potentially large lists of IDs.
   * @param productIds An array of Product IDs (string).
   * @returns A promise that resolves to boolean.
   */
  async postProductByIds(productIds: string[]): Promise<boolean> {
    if (!productIds || productIds.length === 0) {
      return false;
    }

    const uniqueProductIds = [...new Set(productIds)]; // Ensure unique IDs
    try {
      const response: AxiosResponse<boolean> = await firstValueFrom(
        this.httpService.post<boolean>(
          `${this.productSvcUrl}/tag/tagging-best-seller`,
          { ids: uniqueProductIds.map((id) => id.toString()) },
        ),
      );

      return response.data;
    } catch (error) {
      console.error(`[OrderService][Product-Proxy-Service]`, error);
      return false; // return a safe fallback
    }
  }
}
