import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator to extract the userId from the authenticated user object.
 * Assumes that the JwtStrategy has attached a `user` object to the request
 * with a `userId` property (e.g., `{ userId: '...', username: '...' }`).
 *
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
    // Ensure that your JwtStrategy returns an object with a `userId` property.
    return request.user?.sub;
  },
);
