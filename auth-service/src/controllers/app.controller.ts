import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get("/health")
  health(): { health: string } {
    return { health: "Service is up and running" };
  }
}
