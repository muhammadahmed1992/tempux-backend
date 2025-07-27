import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import ResponseHandlerInterceptor from './interceptor/response-handler.interceptor';
import { AllExceptionsFilter } from './filters/global.exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
  await app.listen(3001);
}
bootstrap();
