import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { UserService } from "@Services/user.service";
import { CreateUserDto } from "@DTO/create.user.dto";
import ApiResponse from "src/common/helper/api-response";
import { LoginRequestDTO } from "@DTO/login-request.dto";
import { LoginDTO } from "@DTO/login.dto";
import { OTPVerificationRequestDTO } from "@DTO/otp.verification.dto";
import { ResendOTPDTO } from "@DTO/resend.otp.dto";
import { AuthGuard } from "@nestjs/passport";
import { SocialLoginResponseDTO } from "@DTO/social-login-response.dto";
import { ConfigService } from "@nestjs/config";
import { Request, Response } from "express";

@Controller("user")
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService
  ) {}

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

  // --- Google OAuth ---
  @Get("google")
  async googleAuth(@Req() req: Request, @Res() res: Response) {
    const userType = req.query?.userType as string;

    if (!userType) {
      console.error(
        "User type is missing in the initial Google login request."
      );
      return res.redirect("/login?error=user_type_missing");
    }

    // Generate a state parameter that includes the userType
    const state = encodeURIComponent(
      JSON.stringify({
        userType: userType,
        csrf: Math.random().toString(36).substring(2, 15),
      })
    );

    const clientID = this.configService.get<string>("GOOGLE_CLIENT_ID");
    const callbackURL = "http://localhost:3001/user/google/callback"; // Must match GoogleStrategy's callbackURL

    // Manually construct the Google OAuth URL
    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientID}&` +
      `redirect_uri=${encodeURIComponent(callbackURL)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent("email profile")}&` +
      `state=${state}`; // Pass the state parameter

    console.log(`--- AuthController.googleAuth() Redirecting ---`);
    console.log("Generated Google Auth URL:", googleAuthUrl); // Log the full URL being sent to Google
    console.log("State parameter sent to Google:", state); // Log the encoded state
    console.log("Request URL (before redirect):", req.url); // This will now print!

    return res.redirect(googleAuthUrl);
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    console.log("Callback endpoint hit!"); // Add this line
    console.log("Request Query:", req.url); // Add this to see what's in the query
    // This endpoint is hit after Google authenticates the user.
    // The 'user' object is populated by GoogleStrategy.validate()
    // Cast to your social login response dto...
    // TODO: Will refactor any to strongly typed object
    const user = (req as any).user.data;

    if (!user) {
      // Handle error if user is not found or validation failed
      //return res.redirect("/login?error=google_login_failed"); // Redirect to frontend login with error
    }

    // Generate your application's JWT
    const { accessToken } = (await this.userService.login(user)).data;

    // Redirect to your frontend with the JWT (e.g., as a query parameter or in a cookie)
    // For simplicity, using query parameter. In production, consider HttpOnly cookies.
    return res.redirect(`/dashboard?token=${accessToken}`);
  }
}
