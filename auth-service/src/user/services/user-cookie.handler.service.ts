import { Injectable } from '@nestjs/common';
import CookieHelper from '@User/helper/cookie.helper';
import { Response } from 'express';

@Injectable()
export class UserCookieHandlerService {
  constructor() {}

  /**
   * @param token This contains the jwt-token of after successfully logged-in user
   * @returns nothing but creates a access_token + isAuthenticated http cookie
   */
  handleLoginCookie(res: Response, token: string, domainUrl: string) {
    // Access token
    CookieHelper.setCookies(res as any, 'access_token', true, token, domainUrl);

    // isAuthenticated flag
    CookieHelper.setCookies(
      res as any,
      'isAuthenticated',
      false, // doesn’t need to be httpOnly if frontend should read it
      true,
      domainUrl,
    );
  }

  /**
   * Clears cookies on logout
   */
  handleLogoutCookie(res: Response, domainUrl: string) {
    CookieHelper.clearCookies(
      res as any,
      'isAuthenticated',
      'strict',
      false,
      domainUrl,
    );
    CookieHelper.clearCookies(
      res as any,
      'access_token',
      'strict',
      true,
      domainUrl,
    );
    CookieHelper.clearCookies(res as any, 'ue', 'strict', false, domainUrl);
    CookieHelper.clearCookies(
      res as any,
      'provider',
      'strict',
      false,
      domainUrl,
    );
  }

  /**
   * Creates cookies for user account consent form, containing the user social email and provider name
   */
  handleUserSocialLoginDetails(
    res: Response,
    data: { socialEmail: string; provider: string },
    domainUrl: string,
  ) {
    CookieHelper.setCookies(
      res as any,
      'ue',
      false,
      data.socialEmail,
      domainUrl,
      3600000, // 1 hour
    );
    CookieHelper.setCookies(
      res as any,
      'provider',
      false,
      data.provider,
      domainUrl,
      3600000, // 1 hour
    );
    // isAuthenticated flag
    CookieHelper.setCookies(
      res as any,
      'isAuthenticated',
      false, // doesn’t need to be httpOnly if frontend should read it
      'true',
      domainUrl,
      3600000 * 24 * 7, // 7 days
    );
  }
}
