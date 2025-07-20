import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import ResponseHandlerInterceptor from "./interceptor/response-handler.interceptor";
import { AllExceptionsFilter } from "./filters/global.exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable the ValidationPipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips properties not defined in the DTO
      forbidNonWhitelisted: true, // Throws an error if non-whitelisted properties are present
      transform: true,
      transformOptions: {
        enableImplicitConversion: true, // Allows automatic type conversion (e.g., "1" to 1 for numbers)
      },
      // disableErrorMessages: true, // Optional: Disable error messages in production
    })
  );
  app.useGlobalInterceptors(new ResponseHandlerInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  console.log(`running port of auth is : ${process.env.PORT}`);
  await app.listen(3001);
}
bootstrap();
