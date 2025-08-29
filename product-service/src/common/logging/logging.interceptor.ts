import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  trace,
  context as otContext,
  SpanStatusCode,
} from '@opentelemetry/api';
import { AppLoggerService } from './logger.service';

export interface RequestWithCorrelation extends Request {
  requestId?: string;
  startTime?: number;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<RequestWithCorrelation>();
    const response = ctx.getResponse<Response>();

    const requestId = this.getOrGenerateRequestId(request);
    request.requestId = requestId;
    request.startTime = Date.now();
    response.setHeader('X-Request-ID', requestId);

    const { method, url, headers } = request;
    const userAgent = headers['user-agent'] || '';

    const tracer = trace.getTracer('product-service');
    const span = tracer.startSpan(`${method} ${url}`, {
      attributes: {
        'http.method': method,
        'http.url': url,
        'http.user_agent': userAgent,
        'request.id': requestId,
      },
    });

    this.logger.debug({
      message: `Incoming ${method} ${url}`,
      context: {
        requestId,
        method,
        url,
        userAgent,
        operation: 'request_start',
      },
    });

    return new Observable((subscriber) => {
      otContext.with(otContext.active(), () => {
        next
          .handle()
          .pipe(
            tap(() => {
              const duration = Date.now() - (request.startTime || Date.now());
              const statusCode = response.statusCode;
              span.setAttributes({
                'http.status_code': statusCode,
                'http.response.duration_ms': duration,
              });
              this.logger.logRequest(
                method,
                url,
                statusCode,
                duration,
                requestId,
              );
              span.setStatus({ code: SpanStatusCode.OK });
              span.end();
            }),
            catchError((error) => {
              const duration = Date.now() - (request.startTime || Date.now());
              const statusCode = error.status || error.statusCode || 500;
              span.setAttributes({
                'http.status_code': statusCode,
                'http.response.duration_ms': duration,
              });
              this.logger.error({
                message: `${method} ${url} - ERROR ${statusCode} in ${duration}ms`,
                context: {
                  requestId,
                  method,
                  url,
                  statusCode,
                  duration,
                  operation: 'request_error',
                },
                error,
              });
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error.message,
              });
              span.recordException(error);
              span.end();
              throw error;
            }),
          )
          .subscribe({
            next: (v) => subscriber.next(v),
            error: (e) => subscriber.error(e),
            complete: () => subscriber.complete(),
          });
      });
    });
  }

  private getOrGenerateRequestId(request: RequestWithCorrelation): string {
    const existingId =
      request.headers['x-request-id'] ||
      request.headers['x-correlation-id'] ||
      request.headers['x-trace-id'];
    if (existingId && typeof existingId === 'string') return existingId;
    return uuidv4();
  }
}

export function correlationIdMiddleware(
  req: RequestWithCorrelation,
  res: Response,
  next: () => void,
) {
  const requestId =
    req.headers['x-request-id'] ||
    req.headers['x-correlation-id'] ||
    req.headers['x-trace-id'] ||
    uuidv4();
  req.requestId = requestId as string;
  req.startTime = Date.now();
  res.setHeader('X-Request-ID', requestId);
  next();
}
