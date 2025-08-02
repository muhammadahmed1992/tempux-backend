import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import ResponseHandlerInterceptor from './interceptor/response-handler.interceptor';
import { AllExceptionsFilter } from './filters/global.exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { BigIntInterceptor } from './interceptor/big.int.interceptor';
import { HashidsInterceptor } from './interceptor/encode-decode-senstive-data.interceptor';
import { HashidsService } from '@HashIds/hashids.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
  app.enableCors({
    origin: (origin: any, callback: any) => {
      // This function dynamically reflects the origin, effectively allowing all.
      // It satisfies the CORS specification requirement for 'credentials: true'
      // by not using the '*' wildcard for the 'Access-Control-Allow-Origin' header,
      // but instead setting it to the actual requesting origin.
      console.log(`request coming from ${origin}`);
      callback(null, true);
    },
    methods: '*', // Explicitly allow all common HTTP methods
    allowedHeaders:
      'Content-Type, Accept, Authorization, X-Requested-With, X-Api-Key', // Explicitly list headers
    credentials: true, // Allow cookies and authorization headers to be sent
  });

  app.useGlobalInterceptors(new ResponseHandlerInterceptor());
  app.useGlobalInterceptors(new BigIntInterceptor());
  app.useGlobalInterceptors(new HashidsInterceptor(hashidsService));
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen(3003);
}
bootstrap();
