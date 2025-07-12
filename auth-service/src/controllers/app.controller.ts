import ApiResponse from "@Helper/api-response";
import ResponseHelper from "@Helper/response-helper";
import { Controller, HttpStatus } from "@nestjs/common";

@Controller()
export class AppController {
  async getHealth(): Promise<ApiResponse<boolean>> {
    return ResponseHelper.CreateResponse<boolean>(
      "Auth Service is up and running",
      true,
      HttpStatus.OK
    );
  }
}
