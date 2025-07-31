// src/config/StaticConfig.ts (Create a new file for your static config)

export class StaticConfiguration {
  private static _viewershipWindowHours: number | undefined;

  /**
   * Getter to Fetch Viewership Window hour for a unique product show count
   */
  public static get viewershipWindowHours(): number {
    if (StaticConfiguration._viewershipWindowHours === undefined) {
      console.warn(
        '[StaticConfigurationKeys] StaticConfiguration.viewershipWindowHours accessed before initialization.',
      );
      // TOOD: Need to implement proper fallback..
      return 48;
    }
    return StaticConfiguration._viewershipWindowHours;
  }

  /**
   * and Setter to Fetch Viewership Window hour for a unique product show count
   */
  public static set viewershipWindowHours(value: number) {
    StaticConfiguration._viewershipWindowHours = value;
  }
}
