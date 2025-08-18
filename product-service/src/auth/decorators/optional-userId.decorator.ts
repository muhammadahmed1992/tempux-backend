import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const OptionalUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): bigint | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id ? BigInt(request.user.id) : null;
  },
);
