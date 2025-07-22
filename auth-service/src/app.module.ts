import { Module } from "@nestjs/common";
import { UserController } from "@Controllers/user.controller";
import { UserService } from "@Services/user.service";
import { UserRepository } from "@Repository/users.repository";
import { PrismaClient } from "@prisma/client";
import { PrismaService } from "@Services/prisma.service";
import { AppController } from "@Controllers/app.controller";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { GoogleStrategy } from "./social-login/google-strategy";
import { FacebookStrategy } from "./social-login/facebook-strategy";
import { EmailModule } from "@Module/email.module";
import { EncryptionHelper } from "@Helper/encryption.helper";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET") || "yourSecretKeyHere",
        signOptions: { expiresIn: "180d" },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
    EmailModule,
  ],
  controllers: [AppController, UserController],
  providers: [
    UserService,
    UserRepository,
    PrismaService,
    PrismaClient,
    ConfigService,
    GoogleStrategy,
    FacebookStrategy,
    EncryptionHelper,
  ],
  exports: [],
})
export class AppModule {}
