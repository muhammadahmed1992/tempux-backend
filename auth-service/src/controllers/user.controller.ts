import { Body, Controller, Post, Put } from "@nestjs/common";
import { UserService } from "@Services/user.service";
import { CreateUserDto } from "@DTO/create.user.dto";
import ApiResponse from "src/common/helper/api-response";
import { LoginRequestDTO } from "@DTO/login-request.dto";
import { LoginDTO } from "@DTO/login.dto";
import { OTPVerificationRequestDTO } from "@DTO/otp.verification.dto";
import { ResendOTPDTO } from "@DTO/resend.otp.dto";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post("register")
  async create(@Body() user: CreateUserDto): Promise<ApiResponse<boolean>> {
    return await this.userService.create(user);
  }

  @Post("login")
  async login(@Body() login: LoginRequestDTO): Promise<ApiResponse<LoginDTO>> {
    return await this.userService.login(login);
  }

  @Put("verify-otp")
  async verify(
    @Body() verify: OTPVerificationRequestDTO
  ): Promise<ApiResponse<boolean>> {
    return await this.userService.verifyOTP(verify);
  }

  @Post("generate-otp")
  async generateOTP(
    @Body() verify: OTPVerificationRequestDTO
  ): Promise<ApiResponse<boolean>> {
    return await this.userService.verifyOTP(verify);
  }

  @Post("resent-otp")
  async resendOTP(@Body() resend: ResendOTPDTO): Promise<ApiResponse<boolean>> {
    return await this.userService.resendOTP(resend);
  }
}
