import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductProxyModule } from '@Proxy/product-proxy/product-proxy.module';
import { HashidsModule } from '@HashIds/hash-ids.module';
import { GlobalConfigurationModule } from '@GlobalConfiguration/global-configuration.module';
import { ShippingModule } from './shipping/shipping.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GlobalConfigurationModule,
    HashidsModule,
    ProductProxyModule,
    ShippingModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
