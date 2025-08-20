import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Put,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './services/user.service';
import { CreateUserDto } from './dtos/create.user.dto';
import ApiResponse from '@Helper/api-response';
import { LoginRequestDTO } from './dtos/login-request.dto';
import { LoginDTO } from './dtos/login.dto';
import { OTPVerificationRequestDTO } from './dtos/otp.verification.dto';
import { ResendOTPDTO, ResetPasswordRequestDTO } from './dtos/resend.otp.dto';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { EmailTemplateType } from '@Email/factory/email.template.type';
import { ForgotPasswordDTO } from './dtos/update.password.dto';
import { AuthCookieInterceptor } from './interceptor/auth.cookie.interceptor';
import { SocialLoginService } from './services/social-login.service';
import { SocialAuthRedirectInterceptor } from './interceptor/social-auth-redirect.interceptor';
import ResponseHelper from '@Helper/response-helper';
import CookieHelper from './helper/cookie.helper';
import { ProviderType } from './dtos/user.details.response.dto';
import { HeaderAuthGuard } from 'src/auth/guards/auth-user-guard';
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly socialLoginService: SocialLoginService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async create(@Body() user: CreateUserDto): Promise<ApiResponse<boolean>> {
    return await this.userService.create(user);
  }

  @Post('login')
  @UseInterceptors(AuthCookieInterceptor)
  async login(
    @Body() login: LoginRequestDTO,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<LoginDTO>> {
    return this.userService.login(login);
  }

  @Post('verify-otp')
  async verify(
    @Body() verify: OTPVerificationRequestDTO,
  ): Promise<ApiResponse<boolean>> {
    return await this.userService.verifyOTP(verify);
  }

  @Post('resend-otp')
  async resendOTP(@Body() resend: ResendOTPDTO): Promise<ApiResponse<boolean>> {
    if (!resend.token) throw new BadRequestException('Invalid otp reset token');
    return this.userService.resendOTP(
      resend,
      EmailTemplateType.OTP_VERIFICATION,
    );
  }

  @Post('reset/password')
  async generatePasswordResetLink(
    @Body() resend: ResetPasswordRequestDTO,
  ): Promise<ApiResponse<boolean>> {
    return this.userService.generateResetPasswordLink(
      resend,
      EmailTemplateType.PASSWORD_RESET,
    );
  }

  @Put('password')
  async forgotPassword(
    @Body() request: ForgotPasswordDTO,
  ): Promise<ApiResponse<boolean>> {
    if (request.newPassword !== request.confirmPassword) {
      throw new BadRequestException('New and confirm password must match');
    }
    return await this.userService.forgotPassword(request);
  }

  // Google Auth
  @Get('google')
  async googleAuth(@Res() res: Response) {
    console.log('--- AuthController.googleAuth() Initial Request ---');
    const redirectUrl = this.socialLoginService.getGoogleLoginUrl();
    console.log('Generated Google Auth URL:', redirectUrl);
    return res.redirect(redirectUrl);
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @UseInterceptors(SocialAuthRedirectInterceptor, AuthCookieInterceptor)
  async googleAuthRedirect() {
    console.log('Google callback endpoint hit!');
  }

  /**
   * Initiates the Facebook OAuth2 login flow.
   * Frontend calls: GET http://localhost:3001/user/facebook
   * This endpoint manually constructs the Facebook OAuth URL with a 'state' parameter.
   */
  @Get('facebook')
  async facebookAuth(@Res() res: Response) {
    console.log('--- AuthController.facebookAuth() Initial Request ---');
    const redirectUrl = this.socialLoginService.getFacebookLoginUrl();
    console.log('Generated Facebook Auth URL:', redirectUrl);

    return res.redirect(redirectUrl);
  }

  /**
   * Handles the callback from Facebook after user authentication.
   * Facebook redirects the user back to this endpoint. Passport's FacebookStrategy
   * processes the response and populates `req.user`.
   */
  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook')) // Use AuthGuard for 'facebook' strategy
  @UseInterceptors(SocialAuthRedirectInterceptor, AuthCookieInterceptor)
  async facebookAuthRedirect() {
    console.log('Facebook Callback endpoint hit!');
  }

  @Post('details-by-ids')
  async getUsersDetailsByIdsPost(@Body('ids') userIds: number[]) {
    // This is generally preferred for a large number of IDs.
    return this.userService.findUsersByIds(userIds);
  }

  @Post('account-existance')
  async validateAssociatedAccount(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body('email') email: string,
  ) {
    const provider = CookieHelper.getCookieValue(
      req,
      'provider',
    ) as ProviderType;
    const socialEmail = decodeURIComponent(
      CookieHelper.getCookieValue(req, 'ue')!,
    );

    if (!provider || !socialEmail) {
      this.clearCookies(req, res);
      throw new UnauthorizedException(
        'Your session has been expired. Please re-login again',
      );
    }

    return this.userService.validateExistingAccount(
      email,
      socialEmail,
      provider,
    );
  }

  @Post('/social-media')
  async createUserBySocialMedia(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const provider = CookieHelper.getCookieValue(
      req,
      'provider',
    ) as ProviderType;
    const socialEmail = decodeURIComponent(
      CookieHelper.getCookieValue(req, 'ue')!,
    );
    console.log(`social email: ${socialEmail}`);
    if (!provider || !socialEmail) {
      this.clearCookies(req, res);
      throw new UnauthorizedException(
        'Your session has been expired. Please re-login again',
      );
    }

    const result = await this.userService.createUserBySocialLoginEmail(
      socialEmail,
      provider,
    );

    return result;
  }

  @UseGuards(HeaderAuthGuard)
  @Get('/me')
  /**
   * @returns It will returns logged-in user's display name and profileImageUrl.
   */
  public async me(@Req() request: Request & { user?: JwtUser }) {
    if (!request.user) throw new UnauthorizedException();
    return this.userService.getProfile(request.user.id);
  }

  @UseGuards(HeaderAuthGuard)
  @Post('logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.clearCookies(req, res);
    return ResponseHelper.CreateResponse<any>(
      'You have been successfully logout',
      null,
      HttpStatus.OK,
    );
  }

  // TODO: Will fix typings
  private async clearCookies(req: any, res: any) {
    const frontEndUrl = this.configService.get<string>('FRONTEND_URL')!;
    const isProd =
      (this.configService.get<string>('NODE_ENV') || '').toLowerCase() ===
      'production';
    CookieHelper.clearAllCookies(req, res, 'strict', isProd, frontEndUrl);
  }
}

interface JwtUser {
  id: bigint;
  email: string;
}
