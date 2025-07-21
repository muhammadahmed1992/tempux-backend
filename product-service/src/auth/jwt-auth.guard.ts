// products-service/src/auth/jwt-auth.guard.ts
import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Custom JWT authentication guard.
 * Extends Passport's AuthGuard for the 'jwt' strategy.
 * Apply this guard to controller methods or classes using `@UseGuards(JwtAuthGuard)`.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
