import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { UserCookieHandlerService } from '@User/services/user-cookie.handler.service';

@Injectable()
export class LogoutCookieInterceptor implements NestInterceptor {
  constructor(
    private readonly configService: ConfigService,
    private readonly userCookieHandler: UserCookieHandlerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    return next.handle().pipe(
      tap((data) => {
        // only clear cookies if logout is successful
        if (data?.statusCode === HttpStatus.OK) {
          const dns = this.configService.get<string>('DNS')!;
          this.userCookieHandler.handleLogoutCookie(res, dns);
        }
      }),
    );
  }
}
