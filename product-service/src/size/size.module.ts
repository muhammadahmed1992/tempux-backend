import { Module } from '@nestjs/common';
import { SizeController } from './size.controller';
import { SizeService } from './size.service';
import { SizeRepository } from './size.repository';

@Module({
  controllers: [SizeController],
  providers: [SizeService, SizeRepository],
})
export class SizeModule {}
