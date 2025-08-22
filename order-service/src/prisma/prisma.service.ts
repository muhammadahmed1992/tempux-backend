// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();
  }

  async onModuleInit() {
    // TODO: Need to make sure PrismaService calls only at once
    console.log('PrismaService connected!');
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
