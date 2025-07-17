// products-service/src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";

// Define the expected JWT payload structure
// This should match the payload you sign in your auth-service
export interface JwtPayload {
  email: string;
  sub: bigint; // User ID
  userType: number; // User type ID
  // Add any other claims you include in your JWT
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>("JWT_SECRET");

    // Option A: Throw an error if the secret is not defined (recommended for critical config)
    if (!secret) {
      throw new UnauthorizedException(
        "JWT_SECRET environment variable is not defined or not configured properly."
      );
    }
    super({
      // Method to extract JWT from the request (e.g., from Authorization header as Bearer token)
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Ignore expiration is set to false, so Passport will reject expired tokens
      ignoreExpiration: false,
      // Secret key to verify the token's signature
      secretOrKey: secret,
    });
  }

  /**
   * This method is called after the JWT is successfully extracted and verified.
   * It validates the payload and returns the user object that will be attached to `req.user`.
   * @param payload - The decoded JWT payload.
   * @returns The user object to be attached to `req.user`.
   * @throws UnauthorizedException if validation fails.
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // Here you can perform additional validation, e.g., check if the user exists in the DB.
    // For a microservice architecture, often the payload itself is considered sufficient
    // if it contains enough information (like user ID, email, roles) and the token is valid.
    // If you need to fetch the full user object from the database, you would inject
    // your UsersRepository here and perform a lookup.

    // Example: If you want to ensure the user still exists and is not deleted
    // const user = await this.usersRepository.findById(payload.sub);
    // if (!user || user.is_deleted) {
    //   throw new UnauthorizedException('User not found or account is disabled.');
    // }

    // If validation passes, return the payload. This payload will be available as `req.user`
    // in your controllers. Ensure the `sub` (user ID) is converted back to BigInt if needed
    // for Prisma operations, as JWT payloads typically store numbers.

    return {
      email: payload.email,
      sub: BigInt(payload.sub), // Convert back to BigInt for Prisma compatibility
      userType: payload.userType,
    };
  }
}
