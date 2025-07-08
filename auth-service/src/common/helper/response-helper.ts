import ApiResponse from "./api-response";
import Meta from "./meta";
export default class ResponseHelper<T> {
  public static CreateResponse<T>(
    message: string,
    data: T,
    statusCode: number,
    meta?: Meta
  ) {
    return new ApiResponse<T>(data, statusCode, message, meta);
  }
}
