import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ServiceResolver } from '@Config/service.resolver';
import { ProxyMiddleware } from './middleware/proxy-middleware';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [ServiceResolver, ProxyMiddleware],
})
export class AppModule {}
