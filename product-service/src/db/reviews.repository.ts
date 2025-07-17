import { Injectable } from "@nestjs/common";
import { Prisma, PrismaClient, reviews_ratings } from "@prisma/client";
import { BaseRepository } from "./base.repository";

@Injectable()
export class ReviewsRepository extends BaseRepository<
  reviews_ratings,
  Prisma.reviews_ratingsCreateInput,
  Prisma.reviews_ratingsUpdateInput,
  Prisma.reviews_ratingsWhereUniqueInput,
  Prisma.reviews_ratingsWhereInput,
  Prisma.reviews_ratingsFindUniqueArgs,
  Prisma.reviews_ratingsFindManyArgs,
  Prisma.reviews_ratingsFindFirstArgs
> {
  constructor(private readonly prisma: PrismaClient) {
    super(prisma, prisma.reviews_ratings);
  }
}
