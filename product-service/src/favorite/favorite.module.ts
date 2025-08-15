import { Module } from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { FavoriteRepository } from './favorite.repository';

@Module({
  providers: [FavoriteService, FavoriteRepository],
  exports: [FavoriteService],
})
export class FavoriteModule {}
