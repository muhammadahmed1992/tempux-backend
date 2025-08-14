import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SocialLoginService {
  constructor(private configService: ConfigService) {}

  /**
   * @returns url string for facebook login (oAuth)
   */
  getFacebookLoginUrl() {
    const appId = this.configService.get<string>('FACEBOOK_APP_ID');
    const redirectUri = this.configService.get<string>('FACEBOOK_CALLBACK_URL');
    if (!appId) throw new BadRequestException('Facebook App Id is not defined');
    if (!redirectUri)
      throw new BadRequestException('Facebook Redirect Uri is not defined');

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email,public_profile',
    });
    return `https://www.facebook.com/dialog/oauth?${params}`;
  }

  /**
   * @returns url string for google login (oAuth)
   */
  getGoogleLoginUrl() {
    const appId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.configService.get<string>('GOOGLE_CALLBACK_URL');
    if (!appId) throw new BadRequestException('Facebook App Id is not defined');
    if (!redirectUri)
      throw new BadRequestException('Facebook Redirect Uri is not defined');

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email profile',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }
}
