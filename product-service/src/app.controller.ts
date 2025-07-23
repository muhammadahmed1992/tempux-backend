import ResponseHelper from "@Helper/response-helper";
import { Controller, Get, HttpStatus } from "@nestjs/common";

@Controller()
export class AppController {
  @Get("/")
  home() {
    return { message: "Product service home" };
  }
  @Get("/health")
  health() {
    return ResponseHelper.CreateResponse(
      "Product service is alive",
      { message: "Product service is alive" },
      HttpStatus.OK
    );
  }
}
