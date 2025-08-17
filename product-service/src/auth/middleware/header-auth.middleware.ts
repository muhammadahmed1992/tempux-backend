import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
interface CustomRequest extends Request {
  user?: {
    sub: bigint;
    email: string;
    roles: string[];
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
      sub: BigInt(userId.toString()),
      email: email.toString(),
      roles: roles?.toString().split(',') ?? [],
    };
    next();
  }
}
