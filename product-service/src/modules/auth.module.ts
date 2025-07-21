// products-service/src/auth/auth.module.ts
import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtStrategy } from "@Auth/jwt.strategy";
import { JwtAuthGuard } from "@Auth/jwt-auth.guard";

@Module({
  imports: [
    PassportModule, // Essential for integrating Passport.js strategies
    JwtModule.registerAsync({
      // Configure JwtModule asynchronously to inject ConfigService
      imports: [ConfigModule], // Import ConfigModule to access environment variables
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        // Get JWT_SECRET from .env
        // No expiresIn here, as this module will primarily be for verification
        // (the token's expiry is handled by the issuer, i.e., auth-service)
      }),
      inject: [ConfigService], // Inject ConfigService into the factory
    }),
    ConfigModule, // Ensure ConfigModule is imported if not global
  ],
  providers: [
    JwtStrategy, // Provides the logic for validating JWTs
    JwtAuthGuard, // Provides the guard to protect routes
    // You might add an AuthService here if this service needs to perform its own login/registration
  ],
  exports: [
    JwtModule, // Export JwtModule if other modules need to sign/verify tokens
    JwtAuthGuard, // Export JwtAuthGuard so controllers can use it
    PassportModule, // Export PassportModule if other modules need Passport features
  ],
})
export class AuthModule {}
