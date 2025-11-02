import { Module } from '@nestjs/common';
import { GlobalConfigurationService } from './global-configuration.service';
import { ProductProxyModule } from '@Proxy/product-proxy/product-proxy.module';

@Module({
  imports: [ProductProxyModule],
  providers: [GlobalConfigurationService],
  exports: [GlobalConfigurationService],
})
export class GlobalConfigurationModule {}
