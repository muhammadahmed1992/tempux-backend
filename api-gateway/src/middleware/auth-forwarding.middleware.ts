import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';

interface JwtPayload {
  id: number;
  email: string;
  roles: any[];
}

interface AuthenticatedRequest extends Request {
  cookies: Record<string, string>;
}

@Injectable()
export class AuthForwardingMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  async use(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    let token = '';
    if (req.cookies && req.cookies['access_token'])
      token = req.cookies['access_token'];

    if (!token) {
      // Allow anonymous browsing...
      return next();
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      // Attach claims as headers
      req.headers['x-user-id'] = payload.id.toString();
      req.headers['x-user-email'] = payload.email;
      req.headers['x-user-roles'] = payload.roles;
    } catch {
      throw new UnauthorizedException('Your session has expired');
    }

    next();
  }
}
