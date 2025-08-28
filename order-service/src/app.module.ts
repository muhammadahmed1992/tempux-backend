import { Module } from '@nestjs/common';
import { LoggingModule } from './common/logging/logging.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [LoggingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
