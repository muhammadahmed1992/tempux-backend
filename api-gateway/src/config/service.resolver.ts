import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ServiceResolver {
  private static readonly isProduction = process.env.NODE_ENV === 'production';
  constructor(private configService: ConfigService) {}

  /**
   * Resolves the base URL for a given service key using environment variables.
   *
   * @param serviceKey The key of the service (e.g., 'auth', 'order').
   * @returns The base URL of the service.
   * @throws InternalServerErrorException if the service URL is not configured.
   */
  public getServiceUrl(serviceKey: string): string {
    console.log(`Testing: inside getServiceUrl ${serviceKey}`);
    let serviceUrl: string | undefined;

    // Map service keys to their respective environment variable names
    switch (serviceKey) {
      case 'auth':
        serviceUrl = this.configService.get<string>('AUTH_SERVICE_BASE_URL');
        break;
      case 'order':
        serviceUrl = this.configService.get<string>('ORDER_SERVICE_BASE_URL');
        break;
      case 'product':
        serviceUrl = this.configService.get<string>('PRODUCT_SERVICE_BASE_URL');
        break;
      case 'seller':
        serviceUrl = this.configService.get<string>('SELLER_SERVICE_BASE_URL');
        break;
      // Add cases for any other services you have
      default:
        serviceUrl = undefined; // Service key not recognized
        break;
    }
    console.log(`Checking serviceUrl: ${serviceUrl}`);
    if (!serviceUrl) {
      // Log an error for debugging purposes
      console.error(
        `ServiceResolver: Service URL for key '${serviceKey}' is not configured in environment variables.`,
      );
      throw new InternalServerErrorException(
        `Service URL for '${serviceKey}' is not configured.`,
      );
    }

    return serviceUrl;
  }
}
