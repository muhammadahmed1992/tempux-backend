import {
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

@Injectable()
export class AuthCookieInterceptor implements NestInterceptor {
  constructor(
    private readonly configService: ConfigService,
    private readonly userCookieHanlder: UserCookieHandlerService,
  ) {}

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
        const dns = this.configService.get<string>('DNS')!;
        const origin = req.headers.origin;
        // 2. Check if origin exists and contains 'localhost'
        const isComingFromLocalhost = origin
          ? origin.includes('localhost')
          : true;
        if (
          (data?.statusCode === HttpStatus.OK ||
            data?.statusCode === HttpStatus.CREATED) &&
          data?.data?.accessToken &&
          req.body?.email
        ) {
          this.userCookieHanlder.handleLoginCookie(
            res as any,
            data?.data?.accessToken,
            isProd,
            dns,
            isComingFromLocalhost,
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
