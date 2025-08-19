import { Injectable } from '@nestjs/common';
import { Prisma, tags } from '@prisma/client';
import { BaseRepository } from '@Common/db/base.repository';
import { PrismaService } from '@Prisma/prisma.service';

@Injectable()
export class TagRepository extends BaseRepository<
  tags,
  Prisma.tagsCreateInput,
  Prisma.tagsUpdateInput,
  Prisma.tagsWhereUniqueInput,
  Prisma.tagsWhereInput,
  Prisma.tagsFindUniqueArgs,
  Prisma.tagsFindManyArgs,
  Prisma.tagsFindFirstArgs
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, prisma.tags);
  }

  async findByTagId(tagId: number) {
    return this.prisma.product_tag.findMany({
      where: { tag_id: tagId },
    });
  }

  async addTag(productId: bigint, tagId: number) {
    return this.prisma.product_tag.upsert({
      where: {
        product_id_tag_id: {
          product_id: productId,
          tag_id: tagId,
        },
      },
      update: {}, // nothing to update if it exists
      create: {
        product_id: productId,
        tag_id: tagId,
        created_by: 1, // Super Admin
      },
    });
  }

  // Remove tag relation
  async removeTag(productTagId: number) {
    return this.prisma.product_tag.delete({
      where: { id: productTagId },
    });
  }

  // Remove multiple product-tag relations at once
  async removeTags(productIds: bigint[], tagId: number) {
    return this.prisma.product_tag.deleteMany({
      where: {
        product_id: { in: productIds },
        tag_id: tagId,
      },
    });
  }

  // Add multiple tags to a product at once
  async addTags(productIds: bigint[], tagId: number) {
    return this.prisma.product_tag.createMany({
      data: productIds.map((productId) => ({
        product_id: productId,
        tag_id: tagId,
        created_by: 1,
      })),
      skipDuplicates: true, // avoids duplicates if unique constraint exists
    });
  }
}
