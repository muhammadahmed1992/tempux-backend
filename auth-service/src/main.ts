import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import ResponseHandlerInterceptor from './common/interceptor/response-handler.interceptor';
import { AllExceptionsFilter } from './common/filters/global.exception.filter';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  // Enable the ValidationPipe globally
  // Add this temporary middleware for debugging headers
  app.use((req: any, res: any, next: any) => {
    console.log('Incoming Request Headers For Auth Service:');
    for (const key in req.headers) {
      if (req.headers.hasOwnProperty(key)) {
        console.log(`  ${key}: ${req.headers[key]}`);
      }
    }
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
  app.useGlobalFilters(new AllExceptionsFilter());
  console.log(`running port of auth is : ${process.env.PORT}`);

  await app.listen(3001);
}
bootstrap();
