import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ProxyMiddleware } from './middleware/proxy-middleware';
import Utils from '@Common/utils';
import express from 'express';
import ResponseHandlerInterceptor from './interceptor/response-handler.interceptor';
import { AllExceptionsFilter } from './filters/global.exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Parse body
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Handle OPTIONS preflight before anything else
  app.use(
    (
      req: { method: string; headers: { origin: any } },
      res: {
        header: (arg0: string, arg1: string) => void;
        sendStatus: (arg0: number) => any;
      },
      next: () => void,
    ) => {
      if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.header(
          'Access-Control-Allow-Methods',
          'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        );
        res.header(
          'Access-Control-Allow-Headers',
          'Content-Type, Accept, Authorization, X-Requested-With, X-Api-Key',
        );
        res.header('Access-Control-Allow-Credentials', 'true');
        return res.sendStatus(204); // No content for preflight
      }
      next();
    },
  );

  // Nest CORS config
  app.enableCors({
    origin: (origin: any, callback: (arg0: null, arg1: boolean) => void) => {
      callback(null, true);
    },
    methods: '*',
    allowedHeaders:
      'Content-Type, Accept, Authorization, X-Requested-With, X-Api-Key',
    credentials: true,
  });

  const proxyMiddlewareInstance = app.get(ProxyMiddleware);
  app.use(
    Utils.ReturnServicePaths(),
    proxyMiddlewareInstance.use.bind(proxyMiddlewareInstance),
  );

  app.useGlobalInterceptors(new ResponseHandlerInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
