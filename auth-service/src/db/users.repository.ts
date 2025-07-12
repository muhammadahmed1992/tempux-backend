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
  Prisma.usersFindManyArgs,
  Prisma.usersFindFirstArgs
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
    return this.model.findFirst({
      where: {
        [socialIdField]: socialId,
      },
      select,
    });
  }

  /**
   * Finds a user by their email address.
   * IMPORTANT: This will return the FIRST user found with that email.
   * @param email - The user's email address.
   * @returns The user object or null if not found.
   */
  async findFirstUserByEmail(email: string) {
    // Changed from findUnique to findFirst to allow querying by non-unique fields
    return this.model.findFirst({
      where: { email },
    });
  }
}
