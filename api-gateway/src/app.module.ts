import { Module } from '@nestjs/common';
import { ProxyMiddleware } from './middleware/proxy-middleware';
import { ServiceResolver } from '@Config/service.resolver';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [ServiceResolver, ProxyMiddleware],
})
export class AppModule {}
