import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import ResponseHandlerInterceptor from './common/interceptor/response-handler.interceptor';
import { AllExceptionsFilter } from './common/filters/global.exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { BigIntInterceptor } from './common/interceptor/big.int.interceptor';
import { HashidsInterceptor } from './common/interceptor/encode-decode-senstive-data.interceptor';
import { HashidsService } from '@HashIds/hashids.service';
import { initializeTracing } from './tracing';
initializeTracing();
import { AppLoggerService, correlationIdMiddleware } from './common/logging';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const hashidsService = app.get(HashidsService);
  const logger = app.get(AppLoggerService);
  app.useLogger(logger);
  app.use(correlationIdMiddleware);
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
  app.useGlobalInterceptors(new HashidsInterceptor(hashidsService));
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
