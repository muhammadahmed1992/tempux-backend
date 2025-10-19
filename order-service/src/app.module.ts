import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductProxyModule } from '@Proxy/product-proxy/product-proxy.module';
import { AuthProxyModule } from '@Proxy/auth-proxy/auth-proxy.module';
import { HashidsModule } from '@HashIds/hash-ids.module';
import { GlobalConfigurationModule } from '@GlobalConfiguration/global-configuration.module';
import { ShippingModule } from './shipping/shipping.module';
import { OrderModule } from './order/order.module';
import { LoggingModule } from './common/logging/logging.module';
import { PaymentModule } from './payments/payment.module';

@Module({
  imports: [
    LoggingModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GlobalConfigurationModule,
    HashidsModule,
    ProductProxyModule,
    AuthProxyModule,
    ShippingModule,
    OrderModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
