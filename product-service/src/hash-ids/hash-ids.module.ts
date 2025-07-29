// src/hashids/hashids.module.ts
import { Module } from '@nestjs/common';
import { HashidsService } from './hashids.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [HashidsService],
  exports: [HashidsService],
})
export class HashidsModule {}
