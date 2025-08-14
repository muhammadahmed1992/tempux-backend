import { LoginDTO } from '@DTO/login.dto';
import { Injectable, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import CookieHelper from '@User/helper/cookie.helper';
import { Response } from '@nestjs/common';

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
    isProd: boolean,
    domainUrl: string,
  ) {
    CookieHelper.setCookies(
      res as any,
      'access_token',
      token,
      'strict',
      isProd,
      domainUrl,
    );
  }

  /**
   * @returns this will create cookies for user account consent form, containing the user social email and provider name
   */

  handleUserSocialLoginDetails(
    res: Response,
    data: { socialEmail: string; provider: string },
    isProd: boolean,
    domainUrl: string,
  ) {
    CookieHelper.setCookies(
      res as any,
      'ue',
      data.socialEmail,
      'strict',
      isProd,
      domainUrl,
      3600000, //TODO: 1 hour for now
    );
    CookieHelper.setCookies(
      res as any,
      'provider',
      data.provider,
      'strict',
      isProd,
      domainUrl,
      3600000, //TODO: 1 hour for now
    );
  }
}
