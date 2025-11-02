import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { HttpStatus } from '@nestjs/common';
import { UserService } from '@User/services/user.service';
import ApiResponse from '@Helper/api-response';
import {
  SocialLoginResponseDTO,
  SocialLoginVerifyUserResponseDTO,
} from '@User/dtos/social-login-response.dto';
import { UserCookieHandlerService } from '@User/services/user-cookie.handler.service';
import { AppLoggerService } from '../../common/logging/logger.service';

@Injectable()
export class SocialAuthRedirectInterceptor implements NestInterceptor {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly userCookieHandlerService: UserCookieHandlerService,
    private readonly logger: AppLoggerService,
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

    let origin = '';
    if (req.query.state) {
      origin = decodeURIComponent((req.query.state || '') as string);
    } else {
      origin = (req.headers['x-client-origin'] || '') as string;
    }

    this.logger.debug({
      message: 'Social redirect origin',
      context: { operation: 'oauth_redirect', origin },
    });

    const frontendUrl =
      origin || this.configService.get<string>('FRONTEND_URL')!;

    this.logger.debug({
      message: 'Social redirect frontend URL',
      context: { operation: 'oauth_redirect', frontendUrl },
    });

    const dns = this.configService.get<string>('DNS')!;

    if (!dns) {
      throw new BadRequestException('DNS is not configured');
    }
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
        this.userCookieHandlerService.handleUserSocialLoginDetails(
          res as any,
          { socialEmail, provider },
          dns,
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
          const result = await this.userService.login(responseData);
          if (result?.statusCode === HttpStatus.OK) {
            if (!result?.data.accessToken) throw new UnauthorizedException();

            this.userCookieHandlerService.handleLoginCookie(
              res,
              result.data.accessToken,
              dns,
            );
          }
          res.redirect(frontendUrl);
        } catch (err) {
          this.logger.error({
            message: 'Login error during social redirect',
            context: { operation: 'oauth_redirect' },
            error: err as any,
          });
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
      this.logger.error({
        message: 'Error during social login redirect',
        context: { operation: 'oauth_redirect' },
        error: err as any,
      });
      safeRedirect(`${frontendUrl}/server-error`);
      return of(null);
    }
  }
}
