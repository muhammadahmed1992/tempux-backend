import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserModule } from '@User/user.module';
import { LoggingModule } from './common/logging/logging.module';

@Module({
  imports: [LoggingModule, UserModule],
  controllers: [AppController],
  providers: [],
  exports: [],
})
export class AppModule {}
