import { Controller, Get } from "@nestjs/common";
import { UserService } from "@Services/user.service";

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("/health")
  find(): boolean {
    return true;
  }

  @Get("/email")
  async findUserByEmail(email: string): Promise<string> {
    return await this.userService.findByEmail(email);
  }
}
