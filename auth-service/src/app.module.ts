import { Module } from "@nestjs/common";
import { UserController } from "@Controllers/user.controller";
import { UserService } from "@Services/user.service";
import { UserRepository } from "@Repository/users.repository";
import { PrismaClient } from "@prisma/client";
import { PrismaService } from "@Services/prisma.service";

@Module({
  imports: [],
  controllers: [UserController],
  providers: [UserService, UserRepository, PrismaService, PrismaClient],
  exports: [UserService],
})
export class AppModule {}
