import { HttpStatus } from '@nestjs/common';
import ApiResponse from './api-response';
import Meta from './meta';

export default class ResponseHelper {
  static CreateResponse<T>(
    message: string | string[],
    data: T,
    statusCode: number = HttpStatus.OK,
    meta?: Meta,
  ): ApiResponse<T> {
    return new ApiResponse(data, statusCode, message, meta);
  }

  static CreatePaginatedResponse<T>(
    message: string | string[],
    data: T[],
    page: number,
    pageSize: number,
    totalCount: number,
    statusCode: number = HttpStatus.OK,
  ): ApiResponse<T[]> {
    const totalPages = Math.ceil(totalCount / pageSize);
    const meta = new Meta(page, pageSize, totalCount, totalPages);
    return new ApiResponse(data, statusCode, message, meta);
  }
}
