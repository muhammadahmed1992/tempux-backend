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
    // Prevent duplicates
    const existing = await this.prisma.product_tag.findFirst({
      where: { product_id: productId, tag_id: tagId },
    });

    if (!existing) {
      await this.prisma.product_tag.create({
        data: {
          product_id: productId,
          tag_id: tagId,
          created_by: 1,
        },
      });
    }
  }

  // ✅ Remove tag relation
  async removeTag(productTagId: number) {
    return this.prisma.product_tag.delete({
      where: { id: productTagId },
    });
  }
}
