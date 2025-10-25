import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/prisma.service';
import { BaseRepository } from '@Common/db/repository/base.repository';
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
  async findFirstUserByEmail(email: string, select?: object) {
    // Changed from findUnique to findFirst to allow querying by non-unique fields
    return this.model.findUnique({
      where: { email },
      select,
    });
  }

  /**
   * Update user's newsletter subscription status
   * @param userId - The user's ID
   * @param isSubscribed - Newsletter subscription status
   * @returns Updated user object
   */
  async updateNewsletterSubscription(userId: bigint, isSubscribed: boolean) {
    // First check if user exists
    const existingUser = await this.model.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existingUser) {
      throw new Error(`User with ID ${userId} not found`);
    }

    return this.model.update({
      where: { id: userId },
      data: { is_newsletter_subscribed: isSubscribed },
      select: {
        id: true,
        email: true,
        is_newsletter_subscribed: true,
        updated_at: true,
      },
    });
  }

  /**
   * Get user's newsletter subscription status
   * @param userId - The user's ID
   * @returns User's newsletter subscription status
   */
  async getNewsletterSubscriptionStatus(userId: bigint) {
    return this.model.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        is_newsletter_subscribed: true,
        updated_at: true,
      },
    });
  }
}
