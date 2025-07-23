import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/")
  home() {
    return { message: "Product service home" };
  }
  @Get("/health")
  health() {
    return { message: "Product service is alive" };
  }
}
