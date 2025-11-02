// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppLoggerService } from '@Common/logging';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly logger: AppLoggerService) {
    super();
  }

  async onModuleInit() {
    // TODO: Need to make sure PrismaService calls only at once
    this.logger.info('PrismaService connected!');
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
