import { HttpStatus } from '@nestjs/common';
import Meta from './meta';

export default class ApiResponse<T> {
  constructor(
    response: T,
    statusCode: number = HttpStatus.OK,
    message: string | string[],
    meta?: Meta,
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

  public statusCode: number = HttpStatus.OK;
  public data: T;
  private message: string | string[];
  public success: boolean;
  private meta?: Meta;
}
