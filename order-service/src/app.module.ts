import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductProxyModule } from '@Proxy/product-proxy/product-proxy.module';
import { HashidsModule } from '@HashIds/hash-ids.module';
import { GlobalConfigurationModule } from '@GlobalConfiguration/global-configuration.module';

@Module({
  imports: [GlobalConfigurationModule, HashidsModule, ProductProxyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
