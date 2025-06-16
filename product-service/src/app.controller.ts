import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/")
  home() {
    return { message: "Product service home" };
  }
  @Get("/ping")
  ping() {
    return { message: "Product service is alive" };
  }
}
