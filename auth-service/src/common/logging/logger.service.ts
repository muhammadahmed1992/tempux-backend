import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import pino from 'pino';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { getServiceName } from '../../tracing';

export interface LogContext {
  requestId?: string;
  traceId?: string;
  spanId?: string;
  userId?: string | number;
  operation?: string;
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
  private readonly serviceName: string;

  constructor() {
    this.serviceName = getServiceName();

    // Configure Pino logger with structured output
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      formatters: {
        level: (label: any) => {
          return { level: label };
        },
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
      // File rotation for production
      ...(process.env.NODE_ENV === 'production' && {
        transport: {
          targets: [
            {
              target: 'pino/file',
              options: {
                destination: process.env.LOG_FILE_PATH || './logs/app.log',
                mkdir: true,
              },
            },
            // Console output for Docker
            {
              target: 'pino/file',
              options: {
                destination: 1, // stdout
              },
            },
          ],
        },
      }),
    });
  }

  /**
   * Write an 'error' level log.
   */
  error(data: string | LogMessage, context?: string) {
    this.writeLog('error', data, context);
  }

  /**
   * Write a 'warn' level log.
   */
  warn(data: string | LogMessage, context?: string) {
    this.writeLog('warn', data, context);
  }

  /**
   * Write an 'info' level log.
   */
  log(data: string | LogMessage, context?: string) {
    this.writeLog('info', data, context);
  }

  /**
   * Write a 'debug' level log.
   */
  debug(data: string | LogMessage, context?: string) {
    this.writeLog('debug', data, context);
  }

  /**
   * Write a 'verbose' level log.
   */
  verbose(data: string | LogMessage, context?: string) {
    this.writeLog('debug', data, context); // Pino doesn't have verbose, use debug
  }

  /**
   * Write a 'fatal' level log.
   */
  fatal(data: string | LogMessage, context?: string) {
    this.writeLog('fatal', data, context);
  }

  /**
   * Log HTTP request information
   */
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    requestId: string,
    userId?: string | number,
  ) {
    const logData: LogMessage = {
      message: `${method} ${url} - ${statusCode} completed in ${duration}ms`,
      context: {
        requestId,
        method,
        url,
        statusCode,
        duration,
        ...(userId && { userId }),
        operation: 'http_request',
      },
    };

    if (statusCode >= 400) {
      this.warn(logData);
    } else {
      this.log(logData);
    }
  }

  /**
   * Log database operations
   */
  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    requestId?: string,
    error?: Error,
  ) {
    const logData: LogMessage = {
      message: `Database ${operation} on ${table} completed in ${duration}ms`,
      context: {
        requestId,
        operation: 'database',
        table,
        duration,
        dbOperation: operation,
      },
      ...(error && { error }),
    };

    if (error) {
      this.error(logData);
    } else {
      this.debug(logData);
    }
  }

  /**
   * Log authentication events
   */
  logAuthEvent(
    event: string,
    userId?: string | number,
    email?: string,
    requestId?: string,
    success: boolean = true,
    error?: Error,
  ) {
    const logData: LogMessage = {
      message: `Auth event: ${event} for ${email || userId} - ${
        success ? 'SUCCESS' : 'FAILED'
      }`,
      context: {
        requestId,
        operation: 'authentication',
        event,
        ...(userId && { userId }),
        ...(email && { email }),
        success,
      },
      ...(error && { error }),
    };

    if (!success || error) {
      this.warn(logData);
    } else {
      this.log(logData);
    }
  }

  /**
   * Log external API calls
   */
  logExternalCall(
    service: string,
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    requestId?: string,
  ) {
    const logData: LogMessage = {
      message: `External call to ${service}: ${method} ${url} - ${statusCode} completed in ${duration}ms`,
      context: {
        requestId,
        operation: 'external_api',
        service,
        method,
        url,
        statusCode,
        duration,
      },
    };

    if (statusCode >= 400) {
      this.warn(logData);
    } else {
      this.debug(logData);
    }
  }

  /**
   * Core logging method
   */
  private writeLog(
    level: 'error' | 'warn' | 'info' | 'debug' | 'fatal',
    data: string | LogMessage,
    context?: string,
  ) {
    let logObject: any;

    if (typeof data === 'string') {
      logObject = {
        message: data,
        ...(context && { context: { component: context } }),
      };
    } else {
      logObject = {
        message: data.message,
        ...data.context,
        ...(data.error && {
          error: {
            message: data.error.message,
            stack: data.error.stack,
            name: data.error.name,
          },
        }),
        ...(context && { component: context }),
      };
    }

    // Add current span information if available
    const span = trace.getActiveSpan();
    if (span) {
      const spanContext = span.spanContext();
      logObject.traceId = spanContext.traceId;
      logObject.spanId = spanContext.spanId;

      // If this is an error log, mark the span as error
      if (level === 'error' || level === 'fatal') {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: logObject.message,
        });

        if (data && typeof data === 'object' && data.error) {
          span.recordException(data.error);
        }
      }
    }

    this.logger[level](logObject);
  }

  /**
   * Get the underlying Pino logger instance
   */
  getPinoLogger(): pino.Logger {
    return this.logger;
  }
}
