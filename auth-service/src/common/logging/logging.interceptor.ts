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
  user?: {
    id: string | number;
    email?: string;
  };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<RequestWithCorrelation>();
    const response = ctx.getResponse<Response>();

    // Generate or extract correlation ID
    const requestId = this.getOrGenerateRequestId(request);
    request.requestId = requestId;
    request.startTime = Date.now();

    // Add correlation ID to response headers
    response.setHeader('X-Request-ID', requestId);

    // Get request details
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const userId = request.user?.id;

    // Create a span for this request
    const tracer = trace.getTracer('auth-service');
    const span = tracer.startSpan(`${method} ${url}`, {
      attributes: {
        'http.method': method,
        'http.url': url,
        'http.route': url,
        'http.user_agent': userAgent,
        'request.id': requestId,
        ...(userId && { 'user.id': userId.toString() }),
      },
    });

    // Log incoming request
    this.logger.log({
      message: `Incoming ${method} ${url}`,
      context: {
        requestId,
        method,
        url,
        ip,
        userAgent,
        ...(userId && { userId }),
        operation: 'request_start',
      },
    });

    // Return an Observable as required by NestJS interceptors
    return new Observable((subscriber) => {
      // Execute the downstream handler within the OTel span context
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
                userId,
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
                'error.name': error.name || 'UnknownError',
                'error.message': error.message || 'Unknown error occurred',
              });

              this.logger.error({
                message: `${method} ${url} - ERROR ${statusCode} in ${duration}ms`,
                context: {
                  requestId,
                  method,
                  url,
                  statusCode,
                  duration,
                  ...(userId && { userId }),
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
            next: (value) => subscriber.next(value),
            error: (err) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
      });
    });
  }

  private getOrGenerateRequestId(request: RequestWithCorrelation): string {
    // Check for existing correlation ID in headers (from upstream services)
    const existingId =
      request.headers['x-request-id'] ||
      request.headers['x-correlation-id'] ||
      request.headers['x-trace-id'];

    if (existingId && typeof existingId === 'string') {
      return existingId;
    }

    // Generate new UUID if no correlation ID exists
    return uuidv4();
  }
}

/**
 * Middleware to add correlation ID to requests
 * This can be used as Express middleware for early request processing
 */
export function correlationIdMiddleware(
  req: RequestWithCorrelation,
  res: Response,
  next: () => void,
) {
  // Generate or extract correlation ID
  const requestId =
    req.headers['x-request-id'] ||
    req.headers['x-correlation-id'] ||
    req.headers['x-trace-id'] ||
    uuidv4();

  req.requestId = requestId as string;
  req.startTime = Date.now();

  // Add to response headers for downstream services
  res.setHeader('X-Request-ID', requestId);

  next();
}
