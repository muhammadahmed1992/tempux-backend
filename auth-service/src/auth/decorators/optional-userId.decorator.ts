import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const OptionalUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): bigint | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.sub ? BigInt(request.user.sub) : null;
  },
);
