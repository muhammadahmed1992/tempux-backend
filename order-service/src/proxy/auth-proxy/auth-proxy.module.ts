import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthProxyService } from './auth-proxy.service';
import { Logger } from '@nestjs/common';

@Module({
  imports: [HttpModule],
  providers: [AuthProxyService, Logger],
  exports: [AuthProxyService],
})
export class AuthProxyModule {}
