import {
  Body,
  Controller,
  Get,
  ParseArrayPipe,
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
import { EmailTemplateType } from "@EmailFactory/email.template.type";
import { UpdatePasswordDTO } from "@DTO/update.password.dto";

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

  @Post("resend-otp")
  async resendOTP(@Body() resend: ResendOTPDTO): Promise<ApiResponse<boolean>> {
    return await this.userService.resendOTP(
      resend,
      EmailTemplateType.OTP_VERIFICATION
    );
  }

  @Post("reset/password")
  async generatePasswordResetLink(
    @Body() resend: ResendOTPDTO
  ): Promise<ApiResponse<boolean>> {
    return await this.userService.resendOTP(
      resend,
      EmailTemplateType.PASSWORD_RESET
    );
  }

  @Put("password")
  async updatePassword(
    @Body() request: UpdatePasswordDTO
  ): Promise<ApiResponse<boolean>> {
    return await this.userService.resetPassword(request);
  }

  // Google Auth
  @Get("google")
  async googleAuth(@Req() req: Request, @Res() res: Response) {
    const userType = req.query?.userType as string;

    if (!userType) {
      console.error(
        "User type is missing in the initial Google login request."
      );
      return res.redirect(
        `${this.configService.get<string>(
          "FRONTEND_URL"
        )}/login?error=user_type_missing`
      );
    }

    // Generate a state parameter that includes the userType
    const state = encodeURIComponent(
      JSON.stringify({
        userType: userType,
        csrf: Math.random().toString(36).substring(2, 15),
      })
    );

    const clientID = this.configService.get<string>("GOOGLE_CLIENT_ID");
    const callbackURL = this.configService.get<string>("GOOGLE_CALLBACK_URL")!; // Must match GoogleStrategy's callbackURL
    //"http://localhost:3001/user/google/callback";

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
    const result = await this.userService.login(user);

    // TOOD: If user is created but it is not verified.
    if (!result.data.accessToken) {
      return res.redirect(
        `${this.configService.get<string>(
          "FRONTEND_URL"
        )}dashboard?user=user_not_verified`
      );
    }
    const { accessToken } = result.data;

    // Redirect to your frontend with the JWT (e.g., as a query parameter or in a cookie)
    // For simplicity, using query parameter. In production, consider HttpOnly cookies.
    return res.redirect(
      `${this.configService.get<string>(
        "FRONTEND_URL"
      )}dashboard?token=${accessToken}`
    );
  }

  /**
   * Initiates the Facebook OAuth2 login flow.
   * Frontend calls: GET http://localhost:3001/user/facebook?userType=3
   * This endpoint manually constructs the Facebook OAuth URL with a 'state' parameter.
   */
  @Get("facebook")
  async facebookAuth(@Req() req: Request, @Res() res: Response) {
    console.log("--- AuthController.facebookAuth() Initial Request ---");
    const requestWithQuery = req as any;
    console.log("Incoming Request Query:", requestWithQuery.query);

    const userType = requestWithQuery.query.userType as string;

    if (!userType) {
      console.error(
        "User type is missing in the initial Facebook login request."
      );
      return res.redirect(
        `${this.configService.get<string>(
          "FRONTEND_URL"
        )}login?error=user_type_missing`
      );
    }

    // Generate a state parameter that includes the userType
    const state = encodeURIComponent(
      JSON.stringify({
        userType: userType,
        csrf: Math.random().toString(36).substring(2, 15),
      })
    );

    const clientID = this.configService.get<string>("FACEBOOK_APP_ID");
    const callbackURL = this.configService.get<string>(
      "FACEBOOK_CALLBACK_URL"
    )!;
    //"http://localhost:3001/user/facebook/callback"; // Must match FacebookStrategy's callbackURL

    // Manually construct the Facebook OAuth URL
    const facebookAuthUrl =
      `https://www.facebook.com/v18.0/dialog/oauth?` + // Use a specific API version
      `client_id=${clientID}&` +
      `redirect_uri=${encodeURIComponent(callbackURL)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent("email,public_profile")}&` + // Comma-separated scopes
      `state=${state}`; // Pass the state parameter

    console.log(`--- AuthController.facebookAuth() Redirecting ---`);
    console.log("Generated Facebook Auth URL:", facebookAuthUrl);
    console.log("State parameter sent to Facebook:", state);
    console.log("Request URL (before redirect):", requestWithQuery.url);

    return res.redirect(facebookAuthUrl);
  }

  /**
   * Handles the callback from Facebook after user authentication.
   * Facebook redirects the user back to this endpoint. Passport's FacebookStrategy
   * processes the response and populates `req.user`.
   */
  @Get("facebook/callback")
  @UseGuards(AuthGuard("facebook")) // Use AuthGuard for 'facebook' strategy
  async facebookAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = (req.user as any).data as SocialLoginResponseDTO;

    if (!user) {
      console.error(
        "Facebook login failed: User object not found after strategy validation."
      );
      return res.redirect(
        `${this.configService.get<string>(
          "FRONTEND_URL"
        )}login?error=facebook_login_failed`
      );
    }

    try {
      // Generate your application's JWT
      const result = await this.userService.login(user);

      // TOOD: If user is created but it is not verified.
      if (!result.data.accessToken) {
        return res.redirect(
          `${this.configService.get<string>(
            "FRONTEND_URL"
          )}dashboard?user=user_not_verified`
        );
      }
      console.log(
        `Facebook login successful for user ID: ${user.id}. Redirecting to dashboard.`
      );
      const { accessToken } = result.data;
      return res.redirect(
        `${this.configService.get<string>(
          "FRONTEND_URL"
        )}dashboard?token=${accessToken}`
      );
    } catch (error) {
      console.error(
        "Error generating JWT or redirecting after Facebook login:",
        error
      );
      return res.redirect(
        `${this.configService.get<string>(
          "FRONTEND_URL"
        )}login?error=jwt_generation_failed`
      );
    }
  }
  @Post("details-by-ids")
  async getUsersDetailsByIdsPost(@Body("ids") userIds: number[]) {
    // This is generally preferred for a large number of IDs.
    return this.userService.findUsersByIds(userIds);
  }
}
