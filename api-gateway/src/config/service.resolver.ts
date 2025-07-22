export class ServiceResolver {
  private static readonly isProduction = process.env.NODE_ENV === "production";

  private static readonly staticMap: Record<string, string> = {
    auth: "http://localhost:3001",
    order: "http://localhost:3002",
    product: "http://localhost:3003",
    seller: "http://localhost:3004",
    // add more local services here
  };

  static getServiceUrl(serviceKey: string): string {
    try {
      if (!this.isProduction) {
        const url = this.staticMap[serviceKey];
        console.log(`request is redirecting to the url: ${url}`);
        if (!url)
          throw new Error(`Service "${serviceKey}" not found in local config`);
        return url;
      } else {
        // TODO: Maybe move this to cloudMap or something.
        const url = this.staticMap[serviceKey];
        console.log(`request is redirecting to the url: ${url}`);
        if (!url)
          throw new Error(`Service "${serviceKey}" not found in local config`);
        return url;
      }
    } catch (e) {
      console.error(e);
    }
    return "";
  }
}
