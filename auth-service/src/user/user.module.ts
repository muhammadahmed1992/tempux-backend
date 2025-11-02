import { Module } from '@nestjs/common';
import { UserController } from '@User/user.controller';
import { UserService } from '@User/services/user.service';
import { AddressService } from '@User/services/address.service';
import { GoogleStrategy } from './strategies/google-strategy';
import { FacebookStrategy } from './strategies/facebook-strategy';
import { UserRepository } from './users.repository';
import { EmailModule } from '@Email/email.module';
import { EncryptionHelper } from '@Helper/encryption.helper';
import { PrismaModule } from '@Prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { SocialLoginService } from './services/social-login.service';
import { UserCookieHandlerService } from './services/user-cookie.handler.service';
import { AppLoggerService } from '../common/logging/logger.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'yourSecretKeyHere',
        signOptions: { expiresIn: '180d' },
      }),
      inject: [ConfigService],
    }),
    EmailModule,
    PrismaModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
    AddressService,
    GoogleStrategy,
    FacebookStrategy,
    UserRepository,
    EncryptionHelper,
    SocialLoginService,
    UserCookieHandlerService,
    AppLoggerService,
  ],
})
export class UserModule {}
