import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import ResponseHandlerInterceptor from "./interceptor/response-handler.interceptor";
import { AllExceptionsFilter } from "./filters/global.exception.filter";
import { ValidationPipe } from "@nestjs/common";
import { BigIntInterceptor } from "./interceptor/big.int.interceptor";
import { ParseQueryPipe } from "@Common/pipes/parse-query.pipe";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // // Add this temporary middleware for debugging headers
  // app.use((req: any, res: any, next: any) => {
  //   console.log("Incoming Request Headers:");
  //   for (const key in req.headers) {
  //     if (req.headers.hasOwnProperty(key)) {
  //       console.log(`  ${key}: ${req.headers[key]}`);
  //     }
  //   }
  //   next();
  // });
  const configService = app.get(ConfigService);
  app.useGlobalPipes(new ParseQueryPipe());
  app.useGlobalPipes(
    new ValidationPipe({
      // Strips properties not defined in the DTO
      whitelist: true,
      transform: true,
      transformOptions: {
        // Allows automatic type conversion (e.g., "1" to 1 for numbers)
        enableImplicitConversion: true,
      },
      disableErrorMessages: process.env.NODE_ENV === "production", // Optional: Disable error messages in production
    })
  );

  app.useGlobalInterceptors(new ResponseHandlerInterceptor());
  app.useGlobalInterceptors(new BigIntInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  const port = configService.get<number>("PORT") || 3003;
  await app.listen(3003);
}
bootstrap();
