import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  InternalServerErrorException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '@Services/user.service';
import { CreateUserDto } from '@DTO/create.user.dto';
import ApiResponse from 'src/common/helper/api-response';
import { LoginRequestDTO } from '@DTO/login-request.dto';
import { LoginDTO } from '@DTO/login.dto';
import { OTPVerificationRequestDTO } from '@DTO/otp.verification.dto';
import { ResendOTPDTO, ResetPasswordRequestDTO } from '@DTO/resend.otp.dto';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { EmailTemplateType } from '@EmailFactory/email.template.type';
import { ForgotPasswordDTO } from '@DTO/update.password.dto';
import {
  SocialLoginResponseDTO,
  SocialLoginVerifyUserResponseDTO,
} from '@DTO/social-login-response.dto';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async create(@Body() user: CreateUserDto): Promise<ApiResponse<boolean>> {
    return await this.userService.create(user);
  }

  @Post('login')
  async login(
    @Body() login: LoginRequestDTO,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<LoginDTO>> {
    const response = await this.userService.login(login);
    // If it is a valid user then store inside cookie.
    if (response.statusCode === HttpStatus.OK) {
      // Set the JWT in a secure, HTTP-only cookie.
      res.cookie('access_token', response.data.accessToken, {
        httpOnly: true,
        secure: this.configService.get<string>('NODE_ENV') === 'production',
        sameSite: 'lax',
        maxAge: 15552000000, // 180 days
      });
      res.cookie('display_email', login.email, {
        httpOnly: true,
        secure: this.configService.get<string>('NODE_ENV') === 'production',
        sameSite: 'lax',
        maxAge: 15552000000, // 180 days
      });
    }

    return response;
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

  @Post('password')
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
  async googleAuth(@Req() req: Request, @Res() res: Response) {
    const clientID = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const callbackURL = this.configService.get<string>('GOOGLE_CALLBACK_URL')!;

    // Manually construct the Google OAuth URL
    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientID}&` +
      `redirect_uri=${encodeURIComponent(callbackURL)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('email profile')}&` +
      `prompt=select_account&`;

    console.log(`--- AuthController.googleAuth() Redirecting ---`);
    console.log('Generated Google Auth URL:', googleAuthUrl); // Log the full URL being sent to Google

    return res.redirect(googleAuthUrl);
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const {
      provider,
      socialEmail,
      user: apiResponse,
    } = req.user as {
      provider: string;
      socialEmail: string;
      user: ApiResponse<
        SocialLoginResponseDTO | SocialLoginVerifyUserResponseDTO
      >;
    };

    console.log('Callback endpoint hit!');
    console.log('Request Query:', req.query);
    console.log('Google Auth Redirect endpoint hit!');
    console.log('API Response from validate:', apiResponse);
    console.log('provider:', provider);
    console.log('social email:', socialEmail);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    if (!frontendUrl) {
      throw new InternalServerErrorException(
        'url is not defined for front-end',
      );
    }

    try {
      // Handle the case where the user object is not as expected
      if (!apiResponse || !apiResponse.data || !apiResponse.success) {
        // If user doesn't exist in socialId field and needs consent
        if (apiResponse?.statusCode === HttpStatus.TEMPORARY_REDIRECT) {
          return res.redirect(
            `${frontendUrl}/account-check?provider=google&socialEmail=${encodeURIComponent(
              socialEmail,
            )}`,
          );
        }
        return res.redirect(
          `${frontendUrl}?error=${encodeURIComponent(
            'Social login failed due to an unexpected response.',
          )}`,
        );
      }

      const responseData = apiResponse.data;
      let redirectUrl = frontendUrl;

      // Case 1: Fully verified user
      if ('email' in responseData) {
        const result = await this.userService.login(responseData);
        const accessToken = result.data.accessToken;

        res.cookie('access_token', accessToken, {
          httpOnly: true,
          secure: this.configService.get<string>('NODE_ENV') === 'production',
          sameSite: 'lax',
          maxAge: 15552000000,
        });
        res.cookie('display_email', responseData.email, {
          secure: this.configService.get<string>('NODE_ENV') === 'production',
          sameSite: 'lax',
          maxAge: 15552000000,
        });
        return res.redirect(redirectUrl);
      }

      // Case 2: Needs OTP verification
      if ('resetToken' in responseData) {
        const resetToken = responseData.resetToken;
        redirectUrl = `${redirectUrl}/verify-account/${resetToken}`;
        return res.redirect(redirectUrl);
      }

      // Fallback
      return res.redirect(
        `${redirectUrl}?error=${encodeURIComponent(
          'Invalid response from authentication service.',
        )}`,
      );
    } catch (err: any) {
      console.error('Error during social login redirect:', err);
      return res.redirect(
        `${frontendUrl}?error=${encodeURIComponent(err.message)}`,
      );
    }
  }

  /**
   * Initiates the Facebook OAuth2 login flow.
   * Frontend calls: GET http://localhost:3001/user/facebook?userType=3
   * This endpoint manually constructs the Facebook OAuth URL with a 'state' parameter.
   */
  @Get('facebook')
  async facebookAuth(@Req() req: Request, @Res() res: Response) {
    console.log('--- AuthController.facebookAuth() Initial Request ---');

    const clientID = this.configService.get<string>('FACEBOOK_APP_ID');
    const callbackURL = this.configService.get<string>(
      'FACEBOOK_CALLBACK_URL',
    )!;
    //"http://localhost:3001/user/facebook/callback"; // Must match FacebookStrategy's callbackURL

    // Manually construct the Facebook OAuth URL
    const facebookAuthUrl =
      `https://www.facebook.com/dialog/oauth?` + // Use a specific API version
      `client_id=${clientID}&` +
      `redirect_uri=${encodeURIComponent(callbackURL)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('email,public_profile')}`;

    console.log(`--- AuthController.facebookAuth() Redirecting ---`);
    console.log('Generated Facebook Auth URL:', facebookAuthUrl);

    return res.redirect(facebookAuthUrl);
  }

  /**
   * Handles the callback from Facebook after user authentication.
   * Facebook redirects the user back to this endpoint. Passport's FacebookStrategy
   * processes the response and populates `req.user`.
   */
  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook')) // Use AuthGuard for 'facebook' strategy
  async facebookAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const {
      provider,
      socialEmail,
      user: apiResponse,
    } = req.user as {
      provider: string;
      socialEmail: string;
      user: ApiResponse<
        SocialLoginResponseDTO | SocialLoginVerifyUserResponseDTO
      >;
    };

    console.log('Callback endpoint hit!');
    console.log('Request Query:', req.query);
    console.log('Facebook Auth Redirect endpoint hit!');
    console.log('API Response from validate:', apiResponse);
    console.log('provider:', provider);
    console.log('social email:', socialEmail);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    if (!frontendUrl) {
      throw new InternalServerErrorException(
        'url is not defined for front-end',
      );
    }

    try {
      // Handle the case where the user object is not as expected
      if (!apiResponse || !apiResponse.data || !apiResponse.success) {
        // If user doesn't exist in socialId field and needs consent
        if (apiResponse?.statusCode === HttpStatus.TEMPORARY_REDIRECT) {
          return res.redirect(
            `${frontendUrl}/account-check?provider=facebook&socialEmail=${encodeURIComponent(
              socialEmail,
            )}`,
          );
        }
        return res.redirect(
          `${frontendUrl}?error=${encodeURIComponent(
            'Social login failed due to an unexpected response.',
          )}`,
        );
      }

      const responseData = apiResponse.data;
      let redirectUrl = frontendUrl;

      // Case 1: Fully verified user
      if ('email' in responseData) {
        const result = await this.userService.login(responseData);
        const accessToken = result.data.accessToken;

        res.cookie('access_token', accessToken, {
          httpOnly: true,
          secure: this.configService.get<string>('NODE_ENV') === 'production',
          sameSite: 'lax',
          maxAge: 15552000000,
        });
        res.cookie('display_email', responseData.email, {
          secure: this.configService.get<string>('NODE_ENV') === 'production',
          sameSite: 'lax',
          maxAge: 15552000000,
        });
        return res.redirect(redirectUrl);
      }

      // Case 2: Needs OTP verification
      if ('resetToken' in responseData) {
        const resetToken = responseData.resetToken;
        redirectUrl = `${redirectUrl}/verify-account/${resetToken}`;
        return res.redirect(redirectUrl);
      }

      // Fallback
      return res.redirect(
        `${redirectUrl}?error=${encodeURIComponent(
          'Invalid response from authentication service.',
        )}`,
      );
    } catch (err: any) {
      console.error('Error during social login redirect:', err);
      return res.redirect(
        `${frontendUrl}?error=${encodeURIComponent(err.message)}`,
      );
    }
  }

  @Post('details-by-ids')
  async getUsersDetailsByIdsPost(@Body('ids') userIds: number[]) {
    // This is generally preferred for a large number of IDs.
    return this.userService.findUsersByIds(userIds);
  }

  @Post('account-existance')
  async validateAssociatedAccount(
    @Body('provider') provider: 'google' | 'facebook',
    @Body('socialEmail') socialEmail: string,
    @Body('email') email: string,
  ) {
    console.log(`printing params`);

    console.log('Provider:', provider);
    console.log('Social Email:', socialEmail);
    if (!provider || !socialEmail) {
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
    @Body('provider') provider: 'google' | 'facebook',
    @Body('socialEmail') socialEmail: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log(`printing params`);

    console.log('Provider:', provider);
    console.log('Social Email:', socialEmail);
    if (!provider || !socialEmail) {
      throw new UnauthorizedException(
        'Your session has been expired. Please re-login again',
      );
    }

    const result = await this.userService.createUserBySocialLoginEmail(
      socialEmail,
      provider,
    );

    if (result.statusCode === HttpStatus.CREATED) {
      res.cookie('display_email', socialEmail || 'N/A', {
        httpOnly: true,
        secure: this.configService.get<string>('NODE_ENV') === 'production',
        sameSite: 'lax',
        maxAge: 15552000000, // 180 days
      });
    }

    return result;
  }
}
