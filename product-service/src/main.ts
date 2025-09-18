import { initializeTracing } from './tracing';
initializeTracing();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppLoggerService, correlationIdMiddleware } from './common/logging';
import ResponseHandlerInterceptor from './common/interceptor/response-handler.interceptor';
import { AllExceptionsFilter } from './common/filters/global.exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { BigIntInterceptor } from './common/interceptor/big.int.interceptor';
import { HashidsInterceptor } from './common/interceptor/encode-decode-senstive-data.interceptor';
import { HashidsService } from '@HashIds/hashids.service';
import { ParseQueryPipe } from '@Common/pipes/parse-query.pipe';

async function bootstrap() { 
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(AppLoggerService);
  app.useLogger(logger);
  app.use(correlationIdMiddleware);
  const hashidsService = app.get(HashidsService);
  app.useGlobalPipes(
    new ValidationPipe({
      // Strips properties not defined in the DTO
      whitelist: true,
      transform: true,
      transformOptions: {
        // Allows automatic type conversion (e.g., "1" to 1 for numbers)
        enableImplicitConversion: true,
      },
      disableErrorMessages: process.env.NODE_ENV === 'production', // Optional: Disable error messages in production
    }),
  );

  app.useGlobalInterceptors(new ResponseHandlerInterceptor());
  app.useGlobalInterceptors(new BigIntInterceptor());
  app.useGlobalInterceptors(new HashidsInterceptor(hashidsService, logger));
  app.useGlobalFilters(new AllExceptionsFilter(logger));
  await app.listen(3003);
}
bootstrap();
