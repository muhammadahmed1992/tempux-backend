import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import CookieHelper from '@User/helper/cookie.helper';

@Injectable()
export class AuthCookieInterceptor implements NestInterceptor {
  constructor(private readonly configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    return next.handle().pipe(
      mergeMap((data) => {
        const isProd =
          (this.configService.get<string>('NODE_ENV') || '').toLowerCase() ===
          'production';
        const frontEndUrl = this.configService.get<string>('FRONTEND_URL')!;
        if (
          (data?.statusCode === HttpStatus.OK ||
            data?.statusCode === HttpStatus.CREATED) &&
          data?.data?.accessToken &&
          req.body?.email
        ) {
          CookieHelper.setCookies(
            res,
            'access_token',
            data.data.accessToken,
            'strict',
            isProd,
            frontEndUrl,
          );

          if ((req as any).redirectUrl) {
            res.redirect((req as any).redirectUrl);
            return EMPTY; // Stop pipeline
          }
        }

        return new Observable((observer) => {
          observer.next(data);
          observer.complete();
        });
      }),
    );
  }
}
