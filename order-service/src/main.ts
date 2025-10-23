import { initializeTracing } from './tracing';
initializeTracing();

import { NestFactory } from '@nestjs/core';
import { json, raw } from 'express';

import { AppModule } from './app.module';
import ResponseHandlerInterceptor from './common/interceptor/response-handler.interceptor';
import { AllExceptionsFilter } from './common/filters/global.exception.filter';
import { ValidationPipe, Logger } from '@nestjs/common';
import { BigIntInterceptor } from './common/interceptor/big.int.interceptor';
import { HashidsInterceptor } from './common/interceptor/encode-decode-senstive-data.interceptor';
import { HashidsService } from '@HashIds/hashids.service';
import { AppLoggerService, correlationIdMiddleware } from './common/logging';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const hashidsService = app.get(HashidsService);
  // Get the logger service instance
  const logger = app.get(AppLoggerService);

  // Use custom logger
  app.useLogger(logger);
  app.use(correlationIdMiddleware);

  app.use((req: any, res: any, next: any) => {
    logger.info({
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
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  app.useGlobalInterceptors(new ResponseHandlerInterceptor());
  app.useGlobalInterceptors(new BigIntInterceptor());
  app.useGlobalInterceptors(new HashidsInterceptor(hashidsService, logger));
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  // Configure raw body parsing for Stripe webhooks
  app.use('/payments/webhook', raw({ type: 'application/json' }));
  app.use(json());

  const port = process.env.PORT ?? 3002;

  logger.info({
    message: `Order Service starting on port ${port}`,
    context: {
      operation: 'service_startup',
      port,
    },
  });

  await app.listen(port);
}
bootstrap();
