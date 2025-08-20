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
        let origin = '';
        if (req.query.state) {
          origin = decodeURIComponent((req.query.state || '') as string);
        } else {
          origin = (req.headers['x-client-origin'] || '') as string;
        }

        console.log(`Logging origin: ${origin}`);

        // 2. Check if origin exists and contains 'localhost'
        const isComingFromLocalhost = origin.includes('localhost');
        const frontendUrl = isComingFromLocalhost
          ? origin
          : this.configService.get<string>('FRONTEND_URL')!;

        console.log(`Logging frontend url auth.cookie: ${frontendUrl}`);

        const dns = this.configService.get<string>('DNS')!;

        if (!isComingFromLocalhost && !dns) {
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
