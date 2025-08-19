import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
interface CustomRequest extends Request {
  user?: {
    id: bigint;
  };
}

export const OptionalUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): bigint | null => {
    const request = ctx.switchToHttp().getRequest<CustomRequest>();
    const userId = request.headers['x-user-id'];
    return userId ? BigInt(userId.toString()) : null;
  },
);
