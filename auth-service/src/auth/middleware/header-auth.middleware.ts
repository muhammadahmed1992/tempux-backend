import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
interface CustomRequest extends Request {
  user?: {
    id: bigint;
    email: string;
    roles: bigint[];
  };
}
@Injectable()
export class HeaderAuthMiddleware implements NestMiddleware {
  use(req: CustomRequest, res: Response, next: NextFunction) {
    const userId = req.headers['x-user-id'];
    const email = req.headers['x-user-email'];
    const roles = req.headers['x-user-roles'];

    if (!userId || !email) {
      throw new UnauthorizedException('You session has been expired.');
    }

    req['user'] = {
      id: BigInt(userId.toString()),
      email: email.toString(),
      roles: roles
        ? Array.isArray(roles) // Check if roles is already an array (e.g., [1n, 2n])
          ? roles.map((role) => BigInt(role.toString())) // If array, ensure each element is BigInt
          : roles
              .toString()
              .split(',')
              .map((role) => BigInt(role)) // If string "1,2", split and convert
        : [], // Default to empty array if roles is null/undefined,
    };
    next();
  }
}
