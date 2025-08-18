import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import express from 'express';
import ResponseHandlerInterceptor from './interceptor/response-handler.interceptor';
import { AllExceptionsFilter } from './filters/global.exception.filter';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import Utils from '@Common/utils';
import { ProxyMiddleware } from './middleware/proxy.middleware';
import { AuthForwardingMiddleware } from './middleware/auth-forwarding.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  // Parse body
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Load allowed origins from .env

  const configService = app.get(ConfigService);
  const origins = configService.get<string>('ALLOWED_ORIGINS');
  const allowedOrigins: string[] = origins
    ? origins.split(',').map((origin) => origin.trim())
    : [];
  const corsOptions: CorsOptions = {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ): void => {
      if (!origin) {
        // Allow requests without origin (Postman, curl, etc.)
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn('[CORS] Blocked Origin:', origin);
        return callback(new Error('Not allowed by CORS'), false);
      }
    },
    methods: 'GET,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Accept, Authorization, X-Requested-With, X-Api-Key',
    credentials: true,
  };

  // Because we are managing CORS at nginx level.
  if (configService.get<string>('NODE_ENV') != 'production')
    app.enableCors(corsOptions);

  // Proxy middleware
  const proxyMiddlewareInstance = app.get(ProxyMiddleware);
  const authForwardMiddlewareInstance = app.get(AuthForwardingMiddleware);
  app.use(
    authForwardMiddlewareInstance.use.bind(authForwardMiddlewareInstance),
  );
  app.use(
    Utils.ReturnServicePaths(),
    proxyMiddlewareInstance.use.bind(proxyMiddlewareInstance),
  );

  // Global interceptors and filters
  app.useGlobalInterceptors(new ResponseHandlerInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
