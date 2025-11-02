import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { UserCookieHandlerService } from '@User/services/user-cookie.handler.service';
import { AppLoggerService } from '../../common/logging/logger.service';

@Injectable()
export class AuthCookieInterceptor implements NestInterceptor {
  constructor(
    private readonly configService: ConfigService,
    private readonly userCookieHanlder: UserCookieHandlerService,
    private readonly logger: AppLoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    return next.handle().pipe(
      mergeMap((data) => {
        let origin = '';
        if (req.query.state) {
          origin = decodeURIComponent((req.query.state || '') as string);
        } else {
          origin = (req.headers['x-client-origin'] || '') as string;
        }

        this.logger.debug({
          message: 'Auth cookie origin',
          context: { operation: 'oauth_cookie', origin },
        });

        const frontendUrl =
          origin || this.configService.get<string>('FRONTEND_URL')!;

        this.logger.debug({
          message: 'Auth cookie frontend URL',
          context: { operation: 'oauth_cookie', frontendUrl },
        });

        const dns = this.configService.get<string>('DNS')!;

        if (!dns) {
          throw new BadRequestException('DNS is not configured');
        }
        if (!frontendUrl) {
          throw new BadRequestException('FRONTEND_URL is not configured');
        }

        if (
          (data?.statusCode === HttpStatus.OK ||
            data?.statusCode === HttpStatus.CREATED) &&
          data?.data?.accessToken &&
          req.body?.email
        ) {
          this.userCookieHanlder.handleLoginCookie(
            res as any,
            data?.data?.accessToken,
            dns,
          );
          // We don't need that now as we'd moved this into access_token cookie.
          delete data?.data.accessToken;
        }

        return new Observable((observer) => {
          observer.next(data);
          observer.complete();
        });
      }),
    );
  }
}
