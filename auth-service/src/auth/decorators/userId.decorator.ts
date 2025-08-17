import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator to extract the userId from the authenticated user object.
 * Usage in a controller:
 * @Get('profile')
 * getProfile(@UserId() userId: string) {
 * return this.usersService.getUserProfile(userId);
 * }
 */
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // The `user` object is populated by Passport's JWT strategy
    // Ensure that header-auth.middleware returns an object with a `userId` property.
    return request.user?.sub;
  },
);
