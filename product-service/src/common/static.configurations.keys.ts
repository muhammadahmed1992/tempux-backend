import { GlobalConfigKeys } from './enums/global-config-keys';

export class StaticConfiguration {
  private static _config: Record<string, number> = {};

  /**
   * Set config value by key
   */
  public static set(key: string, value: number) {
    this._config[key] = value;
  }

  /**
   * Get config value by key (with optional fallback)
   */
  public static get(key: string, fallback: number): number {
    return this._config[key] ?? fallback;
  }

  /**
   * Shortcut accessors (optional, if you still want typed getters)
   */
  public static get viewershipWindowHours(): number {
    return this.get(GlobalConfigKeys.PRODUCT_VIEWERSHIP_LAST_SEEN, 48);
  }

  public static get newArrivalWindowHours(): number {
    return this.get(GlobalConfigKeys.NEW_ARRIVAL, 7);
  }

  public static get popularWindowHours(): number {
    return this.get(GlobalConfigKeys.POPULAR, 15);
  }

  public static get bestSellerWindowHours(): number {
    return this.get(GlobalConfigKeys.BEST_SELLER, 10);
  }
}
