// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient, Prisma } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: [{ level: "query", emit: "event" }],
    });

    //TODO: Need to fix
    this.$on("query" as never, (e: Prisma.QueryEvent) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`QUERY: ${e.query}`);
        console.log(`PARAMS: ${e.params}`);
        console.log(`DURATION: ${e.duration}ms`);
      }
    });

    this.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();
      if (process.env.NODE_ENV === "development") {
        console.log(`Middleware Query: ${params.model}.${params.action}`);
        console.log(`Middleware Params: ${params.args}`);
        console.log(`Middleware Duration: ${after - before}ms`);
      }
      return result;
    });
  }

  async onModuleInit() {
    console.log("PrismaService connected!");
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
