import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ServiceResolver } from '@Config/service.resolver';
import { ProxyMiddleware } from './middleware/proxy-middleware';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [ServiceResolver, ProxyMiddleware],
})
export class AppModule {}
