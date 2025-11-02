// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { AppLoggerService } from '../common/logging/logger.service';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly logger: AppLoggerService) {
    super({
      log: [{ level: 'query', emit: 'event' }],
    });

    //TODO: Need to fix
    this.$on('query' as never, (e: Prisma.QueryEvent) => {
      if (process.env.NODE_ENV === 'development') {
        this.logger.info({
          message: 'Prisma query',
          context: {
            operation: 'db_query',
            query: e.query,
            params: e.params,
            duration: e.duration,
          },
        });
      }
    });

    this.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();
      if (process.env.NODE_ENV === 'development') {
        this.logger.info({
          message: 'Prisma middleware',
          context: {
            operation: 'db_middleware',
            model: params.model,
            action: params.action,
            args: params.args,
            duration: after - before,
          },
        });
      }
      return result;
    });
  }

  async onModuleInit() {
    // TODO: Need to make sure PrismaService calls only at once
    this.logger.log({
      message: 'PrismaService connected',
      context: { operation: 'startup' },
    });
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
