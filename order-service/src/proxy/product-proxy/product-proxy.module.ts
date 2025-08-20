import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProductProxyService } from './product-proxy.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule, // To access environment variables
    HttpModule.register({
      // Optional: configure default HTTP settings for this module
      timeout: 20000, // 20 seconds timeout for Product Service calls
      maxRedirects: 5,
    }),
  ],
  providers: [ProductProxyService],
  exports: [ProductProxyService], // Make ProductProxyService available to other modules
})
export class ProductProxyModule {}
