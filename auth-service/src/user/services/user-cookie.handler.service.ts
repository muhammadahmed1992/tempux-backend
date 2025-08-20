import { Injectable, Res } from '@nestjs/common';
import CookieHelper from '@User/helper/cookie.helper';

@Injectable()
export class UserCookieHandlerService {
  constructor() {}

  /**
   * @param token This contains the jwt-token of after successfully logged-in user
   * @returns nothing but creates a access_token http cookie
   */
  handleLoginCookie(
    res: Response,
    token: string,
    domainUrl: string,
    requestOrigin: boolean,
  ) {
    CookieHelper.setCookies(
      res as any,
      'access_token',
      token,
      domainUrl,
      requestOrigin,
    );
  }

  /**
   * @returns this will create cookies for user account consent form, containing the user social email and provider name
   */

  handleUserSocialLoginDetails(
    res: Response,
    data: { socialEmail: string; provider: string },
    domainUrl: string,
    isRequestComingFromLocalHost: boolean,
  ) {
    CookieHelper.setCookies(
      res as any,
      'ue',
      encodeURIComponent(data.socialEmail),
      domainUrl,
      isRequestComingFromLocalHost,
      3600000, //TODO: 1 hour for now
    );
    CookieHelper.setCookies(
      res as any,
      'provider',
      data.provider,
      domainUrl,
      isRequestComingFromLocalHost,
      3600000, //TODO: 1 hour for now
    );
  }
}
