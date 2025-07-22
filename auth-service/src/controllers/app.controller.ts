import ApiResponse from "@Helper/api-response";
import ResponseHelper from "@Helper/response-helper";
import { Controller, Get, HttpStatus } from "@nestjs/common";

@Controller()
export class AppController {
  @Get("/health")
  async getHealth(): Promise<ApiResponse<boolean>> {
    return ResponseHelper.CreateResponse<boolean>(
      "Auth Service is up and running",
      true,
      HttpStatus.OK
    );
  }
}
