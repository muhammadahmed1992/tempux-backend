import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../../common/logging/logger.service';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../services/user.service';
import { Request } from 'express'; // Import Request from express for type hinting

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
    private readonly logger: AppLoggerService,
  ) {
    super({
      clientID: configService.get<string>('FACEBOOK_APP_ID')!,
      clientSecret: configService.get<string>('FACEBOOK_APP_SECRET')!,
      callbackURL: configService.get<string>('FACEBOOK_CALLBACK_URL')!, // Must match Facebook Developer settings
      profileFields: ['id', 'emails', 'name', 'displayName'], // Request necessary profile fields
      scope: ['email', 'public_profile'], // Request email and public profile access
      passReqToCallback: true, // IMPORTANT: Pass the request object to the validate callback
    });
  }

  /**
   * This method is called by Passport after Facebook authenticates the user
   * and redirects back to your callbackURL.
   * It validates the user's profile and passes it to your AuthService.
   * @param req - The Express request object, containing the original query parameters.
   * @param accessToken - Facebook's access token for the user.
   * @param refreshToken - Facebook's refresh token (if requested and granted).
   * @param profile - The user's profile data returned by Facebook.
   * @param done - Callback function to signal Passport that authentication is complete.
   */
  async validate(
    req: Request, // Added Request object as the first parameter
    accessToken: string,
    refreshToken: string,
    profile: any, // Contains user profile data from Facebook
    done: any,
  ): Promise<any> {
    this.logger.debug({
      message: 'FacebookStrategy.validate called',
      context: { operation: 'oauth_validate', provider: 'facebook' },
    });

    const { id, emails, displayName, name } = profile; // Destructure profile data
    const userEmail = emails && emails.length > 0 ? emails[0].value : null;

    // Robust way to get full name: prefer displayName, then combine given/family name
    const fullName =
      displayName ||
      (name && name.givenName && name.familyName
        ? `${name.givenName} ${name.familyName}`
        : 'Facebook User');

    if (!userEmail) {
      this.logger.error({
        message: 'Facebook profile missing email',
        context: { operation: 'oauth_validate', provider: 'facebook' },
        error: new Error('Missing email'),
      });
      return done(new Error('Facebook profile missing email.'), null);
    }

    try {
      // Pass the userType to your UserService for Facebook provider
      const user = await this.userService.validateSocialUser(
        'facebook',
        userEmail,
      );
      done(null, { user, provider: 'facebook', socialEmail: userEmail });
    } catch (err) {
      this.logger.error({
        message: 'Error during Facebook social user validation',
        context: { operation: 'oauth_validate', provider: 'facebook' },
        error: err as any,
      });
      done(err, false);
    }
  }
}
