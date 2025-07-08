// src/repositories/user.repository.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@Services/prisma.service";
import { BaseRepository } from "./base.repository";
import { users } from "@prisma/client";

@Injectable()
export class UserRepository extends BaseRepository<users> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.users);
  }

  async findByEmail(email: string) {
    return this.model.findUnique({ where: { email } });
  }
}
