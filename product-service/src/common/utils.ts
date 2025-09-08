export default class Utils {
  public static ReturnServicePaths(): RegExp {
    const allServiceKeys = ['product', 'order', 'seller', 'auth'];
    const pattern = '^/(' + allServiceKeys.join('|') + ')(/[a-zA-Z0-9-_/]*)?$';
    // TODO: Need to make it more dynamic i.e configure this using AWS service discovery and cloud map
    const routeRegex = new RegExp(pattern);
    return routeRegex;
  }
  public static IsEnumValue<T extends Record<string, string | number>>(
    enumObj: T,
    value: unknown,
  ): value is T[keyof T] {
    return Object.values(enumObj).includes(value as any);
  }

  /**
   * Groups an array of items into alphabetical buckets based on a key selector.
   *
   * @param items - The array of items to group.
   * @param keySelector - Function to extract the string key (e.g., title, name).
   * @param idSelector - Function to extract the ID from the item.
   * @returns Record<string, ItemSummary[]> - Grouped object { A: [{id, title}, ...], B: [...], ... }
   */
  public static groupAlphabetically<T>(
    items: T[],
    keySelector: (item: T) => string | undefined,
    idSelector: (item: T) => string | number,
  ): Record<string, ItemSummary[]> {
    const grouped: Record<string, ItemSummary[]> = {};

    items.forEach((item) => {
      const key = keySelector(item);
      if (!key) return;

      const firstChar = key.charAt(0).toUpperCase();
      const id = idSelector(item);

      if (!grouped[firstChar]) {
        grouped[firstChar] = [];
      }
      grouped[firstChar].push({ id, title: key });
    });

    // Sort groups
    const sortedGrouped: Record<string, ItemSummary[]> = {};
    Object.keys(grouped)
      .sort((a, b) => a.localeCompare(b))
      .forEach((char) => {
        sortedGrouped[char] = grouped[char].sort((a, b) =>
          a.title.localeCompare(b.title),
        );
      });

    return sortedGrouped;
  }
}
