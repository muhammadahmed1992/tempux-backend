import { Module } from '@nestjs/common';
import { ModelController } from './model.controller';
import { ModelService } from './model.service';
import { ModelRepository } from './model.repository';

@Module({
  controllers: [ModelController],
  providers: [ModelService, ModelRepository],
})
export class ModelModule {}
