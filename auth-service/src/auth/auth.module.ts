import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HeaderAuthMiddleware } from './middleware/header-auth.middleware';
import { APP_GUARD } from '@nestjs/core';
import { AuthenticatedGuard } from './guards/authenticated-user.guard';

@Module({
  imports: [ConfigModule],
  providers: [],
  exports: [],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply()
      .exclude(
        {
          path: '/health',
          method: RequestMethod.GET,
        },
        {
          path: 'user/login',
          method: RequestMethod.POST,
        },
        {
          path: 'user/register',
          method: RequestMethod.POST,
        },
        {
          path: 'user/verify-otp',
          method: RequestMethod.POST,
        },
        {
          path: 'user/resend-otp',
          method: RequestMethod.POST,
        },
        {
          path: 'user/reset/password',
          method: RequestMethod.POST,
        },
        {
          path: 'user/google',
          method: RequestMethod.POST,
        },
        {
          path: 'user/facebook',
          method: RequestMethod.POST,
        },
        {
          path: 'user/details-by-ids',
          method: RequestMethod.POST,
        },
        {
          path: 'user/account-existance',
          method: RequestMethod.POST,
        },
        {
          path: 'user/social-media',
          method: RequestMethod.POST,
        },
      )
      .forRoutes('*');
  }
}
