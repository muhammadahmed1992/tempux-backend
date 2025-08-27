import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthProxyService } from './auth-proxy.service';

@Module({
  imports: [HttpModule],
  providers: [AuthProxyService],
  exports: [AuthProxyService],
})
export class AuthProxyModule {}

