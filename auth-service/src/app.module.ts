import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserModule } from '@User/user.module';

@Module({
  imports: [UserModule],
  controllers: [AppController],
  providers: [],
  exports: [],
})
export class AppModule {}
