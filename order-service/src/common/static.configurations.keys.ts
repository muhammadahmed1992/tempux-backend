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
   * Shortcut accessors
   * @returns It will return platform's commission comming from DB, also added a fallback amount
   */
  public static get platformCommission(): number {
    return this.get(GlobalConfigKeys.PLATFORM_COMMISSION, 6.5);
  }
}
