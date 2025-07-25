import { InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export class ServiceResolver {
  private static readonly isProduction = process.env.NODE_ENV === "production";

  // private static readonly staticMap: Record<string, string> = {
  //   auth: "http://localhost:3001",
  //   order: "http://localhost:3002",
  //   product: "http://localhost:3003",
  //   seller: "http://localhost:3004",
  //   // add more local services here
  // };

  constructor(private configService: ConfigService) {}

  // static getServiceUrl(serviceKey: string): string {
  //   try {
  //     if (!this.isProduction) {
  //       const url = this.staticMap[serviceKey];
  //       console.log(`request is redirecting to the url: ${url}`);
  //       if (!url)
  //         throw new Error(`Service "${serviceKey}" not found in local config`);
  //       return url;
  //     } else {
  //       // TODO: Maybe move this to cloudMap or something.
  //       const url = this.staticMap[serviceKey];
  //       console.log(`request is redirecting to the url: ${url}`);
  //       if (!url)
  //         throw new Error(`Service "${serviceKey}" not found in local config`);
  //       return url;
  //     }
  //   } catch (e) {
  //     console.error(e);
  //   }
  //   return "";
  // }

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
      case "auth":
        serviceUrl = this.configService.get<string>("AUTH_SERVICE_BASE_URL");
        break;
      case "order":
        serviceUrl = this.configService.get<string>("ORDER_SERVICE_BASE_URL");
        break;
      case "product":
        serviceUrl = this.configService.get<string>("PRODUCT_SERVICE_BASE_URL");
        break;
      case "seller":
        serviceUrl = this.configService.get<string>("SELLER_SERVICE_BASE_URL");
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
        `ServiceResolver: Service URL for key '${serviceKey}' is not configured in environment variables.`
      );
      throw new InternalServerErrorException(
        `Service URL for '${serviceKey}' is not configured.`
      );
    }

    return serviceUrl;
  }
}
