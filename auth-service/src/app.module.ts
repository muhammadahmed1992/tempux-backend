import { Module } from "@nestjs/common";
import { UserController } from "@Controllers/user.controller";
import { UserService } from "@Services/user.service";
import { UserRepository } from "@Repository/users.repository";
import { PrismaClient } from "@prisma/client";
import { PrismaService } from "@Services/prisma.service";
import { AppController } from "@Controllers/app.controller";
import { JwtModule } from "@nestjs/jwt";
import { EmailService } from "@Services/email.service";
import { ConfigService } from "@nestjs/config";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || "yourSecretKeyHere",
      signOptions: { expiresIn: "1d" },
    }),
  ],
  controllers: [AppController, UserController],
  providers: [
    UserService,
    UserRepository,
    PrismaService,
    PrismaClient,
    EmailService,
    ConfigService,
  ],
  exports: [],
})
export class AppModule {}
