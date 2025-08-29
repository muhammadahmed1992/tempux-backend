// src/hashids/hashids.module.ts
import { Module } from '@nestjs/common';
import { HashidsService } from './hashids.service';
import { ConfigModule } from '@nestjs/config';
import { LoggingModule } from '@Common/logging';

@Module({
  imports: [ConfigModule, LoggingModule],
  providers: [HashidsService],
  exports: [HashidsService],
})
export class HashidsModule {}
