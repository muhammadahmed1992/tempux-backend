import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { defer, from, Observable, of } from 'rxjs';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { HttpStatus } from '@nestjs/common';
import { UserService } from '@User/services/user.service';
import ApiResponse from '@Helper/api-response';
import {
  SocialLoginResponseDTO,
  SocialLoginVerifyUserResponseDTO,
} from '@User/dtos/social-login-response.dto';
import CookieHelper from '@User/helper/cookie.helper';

@Injectable()
export class SocialAuthRedirectInterceptor implements NestInterceptor {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

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

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const isProd =
      (this.configService.get<string>('NODE_ENV') || '').toLowerCase() ===
      'production';

    if (!frontendUrl) {
      throw new BadRequestException('FRONTEND_URL is not configured');
    }

    const safeRedirect = (url: string) => {
      if (!res.headersSent) {
        res.redirect(url);
      }
    };

    try {
      // Case 1: Needs account check / consent
      if (apiResponse?.statusCode === HttpStatus.TEMPORARY_REDIRECT) {
        CookieHelper.setCookies(
          res,
          'ue',
          socialEmail,
          'strict',
          isProd,
          frontendUrl,
          3600000,
        );
        CookieHelper.setCookies(
          res,
          'provider',
          provider,
          'strict',
          isProd,
          frontendUrl,
          3600000,
        );
        safeRedirect(`${frontendUrl}/account-check`);
        return of(null);
      }

      // Case 2: API error or missing data
      if (apiResponse?.statusCode !== HttpStatus.OK || !apiResponse?.data) {
        safeRedirect(`${frontendUrl}/server-error`);
        return of(null);
      }

      const responseData = apiResponse.data;

      // Case 3: Fully verified user
      if ('email' in responseData) {
        try {
          const result = this.userService.login(responseData);
          (req as any).redirectUrl = `${frontendUrl}`;
          // Wrap result in Observable so next interceptor receives it
          return defer(result); // downstream interceptors receive proper `data`
        } catch (err) {
          console.error('Login error:', err);
          safeRedirect(`${frontendUrl}/server-error`);
          return of(null);
        }
      }

      // Case 4: Needs OTP verification
      if ('resetToken' in responseData) {
        safeRedirect(
          `${frontendUrl}/verify-account/${responseData.resetToken}`,
        );
        return of(null);
      }

      // Case 5: Fallback
      safeRedirect(`${frontendUrl}/server-error`);
      return of(null);
    } catch (err) {
      console.error('Error during social login redirect:', err);
      safeRedirect(`${frontendUrl}/server-error`);
      return of(null);
    }
  }
}
