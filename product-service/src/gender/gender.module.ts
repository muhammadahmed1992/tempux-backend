import { Module } from '@nestjs/common';
import { GenderController } from './gender.controller';
import { GenderService } from './gender.service';
import { GenderRepository } from './gender.repository';

@Module({
  controllers: [GenderController],
  providers: [GenderService, GenderRepository],
  exports: [GenderService, GenderRepository],
})
export class GenderModule {}
