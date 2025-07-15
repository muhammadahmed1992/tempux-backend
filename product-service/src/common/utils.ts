export default class Utils {
  public static ReturnServicePaths(): RegExp {
    const allServiceKeys = ["product", "order", "seller", "auth"];
    const pattern = "^/(" + allServiceKeys.join("|") + ")(/[a-zA-Z0-9-_/]*)?$";
    // TODO: Need to make it more dynamic i.e configure this using AWS service discovery and cloud map
    const routeRegex = new RegExp(pattern);
    return routeRegex;
  }
}
