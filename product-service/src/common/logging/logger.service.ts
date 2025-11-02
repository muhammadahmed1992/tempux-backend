import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import pino from 'pino';
import { trace, SpanStatusCode } from '@opentelemetry/api';

export interface LogContext {
  requestId?: string;
  traceId?: string;
  spanId?: string;
  [key: string]: any;
}

export interface LogMessage {
  message: string;
  context?: LogContext;
  error?: Error;
}

@Injectable()
export class AppLoggerService implements NestLoggerService {
  private readonly logger: pino.Logger;
  private readonly serviceName = process.env.SERVICE_NAME || 'product-service';

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      formatters: {
        level: (label: any) => ({ level: label }),
        log: (object: any) => {
          const span = trace.getActiveSpan();
          const traceId = span?.spanContext().traceId;
          const spanId = span?.spanContext().spanId;
          return {
            ...object,
            service: this.serviceName,
            ...(traceId && { traceId }),
            ...(spanId && { spanId }),
          };
        },
      },
      transport:
        process.env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    });
  }

  error(data: string | LogMessage, context?: string) {
    this.write('error', data, context);
  }
  warn(data: string | LogMessage, context?: string) {
    this.write('warn', data, context);
  }
  log(data: string | LogMessage, context?: string) {
    this.write('info', data, context);
  }
  info(data: string | LogMessage, context?: string) {
    this.write('info', data, context);
  }
  fatal(data: string | LogMessage, context?: string) {
    this.write('fatal', data, context);
  }

  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    requestId: string,
  ) {
    this.log({
      message: `${method} ${url} - ${statusCode} completed in ${duration}ms`,
      context: {
        method,
        url,
        statusCode,
        duration,
        requestId,
        operation: 'http_request',
      },
    });
  }

  private write(
    level: 'error' | 'warn' | 'info' | 'debug' | 'fatal',
    data: string | LogMessage,
    component?: string,
  ) {
    const span = trace.getActiveSpan();
    let payload: any;
    if (typeof data === 'string') {
      payload = { message: data, ...(component && { component }) };
    } else {
      payload = {
        message: data.message,
        ...(data.context || {}),
        ...(component && { component }),
        ...(data.error && {
          error: {
            message: data.error.message,
            stack: data.error.stack,
            name: data.error.name,
          },
        }),
      };
      if ((level === 'error' || level === 'fatal') && span) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: payload.message,
        });
        if (data.error) span.recordException(data.error);
      }
    }
    this.logger[level](payload);
  }
}
