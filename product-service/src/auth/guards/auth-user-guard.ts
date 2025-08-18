import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

interface CustomRequest extends Request {
  user?: {
    sub: bigint;
    email: string;
    roles: bigint[];
  };
}

@Injectable()
export class HeaderAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<CustomRequest>();

    const userId = req.headers['x-user-id'];
    const email = req.headers['x-user-email'];
    const roles = req.headers['x-user-roles'];

    if (!userId || !email) {
      throw new UnauthorizedException('Your session has expired.');
    }

    req.user = {
      sub: BigInt(userId.toString()),
      email: email.toString(),
      roles: roles
        ? Array.isArray(roles)
          ? roles.map((role) => BigInt(role.toString()))
          : roles
              .toString()
              .split(',')
              .map((role) => BigInt(role))
        : [],
    };

    return true;
  }
}
