import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { UserProxyService } from "./user-proxy.service";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule, // To access environment variables
    HttpModule.register({
      // Optional: configure default HTTP settings for this module
      timeout: 5000, // 5 seconds timeout for User Service calls
      maxRedirects: 5,
    }),
  ],
  providers: [UserProxyService],
  exports: [UserProxyService], // Make UserProxyService available to other modules
})
export class UserProxyModule {}
