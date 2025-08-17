import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserModule } from '@User/user.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule, UserModule],
  controllers: [AppController],
  providers: [],
  exports: [],
})
export class AppModule {}
