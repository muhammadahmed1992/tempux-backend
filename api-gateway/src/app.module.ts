import {
  InternalServerErrorException,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { ProxyMiddleware } from './middleware/proxy.middleware';
import { ServiceResolver } from '@Config/service.resolver';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthForwardingMiddleware } from './middleware/auth-forwarding.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret)
          throw new InternalServerErrorException('JWT Secret is not defined');
        return { secret };
      },
    }),
  ],
  providers: [ServiceResolver, ProxyMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthForwardingMiddleware, ProxyMiddleware).forRoutes('*');
  }
}
