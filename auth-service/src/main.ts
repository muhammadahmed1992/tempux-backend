import { initializeTracing } from './tracing';
initializeTracing(); // Initialize tracing before any other imports

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import ResponseHandlerInterceptor from './common/interceptor/response-handler.interceptor';
import { AllExceptionsFilter } from './common/filters/global.exception.filter';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppLoggerService, correlationIdMiddleware } from './common/logging';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Get the logger service instance
  const logger = app.get(AppLoggerService);

  // Use custom logger
  app.useLogger(logger);

  app.use(cookieParser());

  // Add correlation ID middleware early in the pipeline
  app.use(correlationIdMiddleware);

  // Enhanced request logging middleware (replace the debug one)
  app.use((req: any, res: any, next: any) => {
    logger.debug({
      message: 'Request headers received',
      context: {
        requestId: req.requestId,
        headers: req.headers,
        operation: 'request_headers',
      },
    });
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips properties not defined in the DTO
      forbidNonWhitelisted: true, // Throws an error if non-whitelisted properties are present
      transform: true,
      transformOptions: {
        enableImplicitConversion: true, // Allows automatic type conversion (e.g., "1" to 1 for numbers)
      },
      // disableErrorMessages: true, // Optional: Disable error messages in production
    }),
  );
  app.useGlobalInterceptors(new ResponseHandlerInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  const port = process.env.PORT || 3001;

  logger.log({
    message: `Auth Service starting on port ${port}`,
    context: {
      port: port.toString(),
      environment: process.env.NODE_ENV || 'development',
      operation: 'startup',
    },
  });

  await app.listen(port);

  logger.log({
    message: `Auth Service successfully started on port ${port}`,
    context: {
      port: port.toString(),
      operation: 'startup_complete',
    },
  });
}
bootstrap();
