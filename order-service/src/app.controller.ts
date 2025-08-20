import ApiResponse from '@Helper/api-response';
import ResponseHelper from '@Helper/response-helper';
import { Controller, Get, HttpStatus } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}

  @Get('health')
  async health(): Promise<ApiResponse<string>> {
    return ResponseHelper.CreateResponse<string>(
      'Your order service is up and running',
      HttpStatus.OK,
    );
  }
}
