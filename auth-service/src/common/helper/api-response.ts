import { HttpStatus } from "@nestjs/common";
import Meta from "./meta";

export default class ApiResponse<T> {
  constructor(
    response: T,
    statusCode: number = HttpStatus.OK,
    message = "",
    meta?: Meta
  ) {
    this.message = message;
    this.data = response;
    if (statusCode >= HttpStatus.BAD_REQUEST) {
      this.success = false;
    } else {
      this.success = true;
    }
    this.statusCode = statusCode;
    this.meta = meta;
  }

  private statusCode: number = HttpStatus.OK;
  public data: T;
  private message = "";
  private success: boolean;
  private meta?: Meta;
}
