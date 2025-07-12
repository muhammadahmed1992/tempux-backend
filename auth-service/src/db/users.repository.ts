// src/repositories/user.repository.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@Services/prisma.service";
import { BaseRepository } from "./base.repository";
import { Prisma, users } from "@prisma/client";

@Injectable()
export class UserRepository extends BaseRepository<
  users,
  Prisma.usersCreateInput,
  Prisma.usersUpdateInput,
  Prisma.usersWhereUniqueInput,
  Prisma.usersFindUniqueArgs,
  Prisma.usersFindManyArgs
> {
  constructor(prisma: PrismaService) {
    super(prisma.users);
  }

  async createUser(data: Prisma.usersCreateInput, select?: object) {
    return this.model.create({
      data,
      select,
    });
  }

  async validateUser(email: string, userType: number, select?: object) {
    return this.model.findUnique({
      where: {
        email_user_type: {
          email,
          user_type: userType,
        },
      },
      select,
    });
  }

  async findUserBySocialId(
    socialIdField: string,
    socialId?: string,
    select?: object
  ) {
    return this.model.findMany({
      where: {
        [socialIdField]: socialId,
      },
      select,
    });
  }
}
