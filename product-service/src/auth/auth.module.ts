import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HeaderAuthMiddleware } from './middleware/header-auth.middleware';
import { APP_GUARD } from '@nestjs/core';
import { AuthenticatedGuard } from './guards/authenticated-user.guard';

@Module({
  imports: [
    ConfigModule, // Ensure ConfigModule is imported if not global
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthenticatedGuard,
    },
  ],
  exports: [],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HeaderAuthMiddleware).forRoutes('*');
  }
}
