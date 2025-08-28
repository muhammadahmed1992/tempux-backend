import { initializeTracing } from './tracing';
initializeTracing();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppLoggerService, correlationIdMiddleware } from './common/logging';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(AppLoggerService);
  app.useLogger(logger);
  app.use(correlationIdMiddleware);
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
