import { Controller, Get, HttpStatus } from "@nestjs/common";
import { AppService } from "./app.service";
import ResponseHelper from "@Helper/response-helper";
import ApiResponse from "@Common/helper/api-response";

@Controller()
export class AppController {
  @Get("/health")
  async getHealth(): Promise<ApiResponse<boolean>> {
    return ResponseHelper.CreateResponse<boolean>(
      "API Gateway is up and running",
      true,
      HttpStatus.OK
    );
  }
}
