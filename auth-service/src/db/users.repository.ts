import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Services/prisma.service';
import { BaseRepository } from './base.repository';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UserRepository extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput,
  Prisma.UserWhereUniqueInput,
  Prisma.UserFindUniqueArgs,
  Prisma.UserFindManyArgs,
  Prisma.UserFindFirstArgs
> {
  constructor(prisma: PrismaService) {
    super(prisma.user);
  }

  async createUser(data: Prisma.UserCreateInput, select?: object) {
    return this.model.create({
      data,
      select,
    });
  }

  async validateUser(email: string, select?: object) {
    return this.model.findUnique({
      where: {
        email,
      },
      select,
    });
  }

  async findUserBySocialId(
    socialIdField: string,
    socialId?: string,
    select?: object,
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
