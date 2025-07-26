// This Passport strategy defines how your application authenticates with Google.

import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '@Services/user.service';
import { Request } from 'express'; // Import Request from express

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL')!, // For local development
      scope: ['email', 'profile'], // Request email and basic profile information
      passReqToCallback: true, // <--- IMPORTANT: Pass the request object to the validate callback
    });
  }

  /**
   * This method is called by Passport after Google authenticates the user
   * and redirects back to your callbackURL.
   * It validates the user's profile and passes it to your UserService.
   * @param req - The Express request object, containing the original query parameters.
   * @param accessToken - Google's access token for the user.
   * @param refreshToken - Google's refresh token (if requested and granted).
   * @param profile - The user's profile data returned by Google.
   * @param done - Callback function to signal Passport that authentication is complete.
   */
  async validate(
    req: Request, // <--- Added Request object as the first parameter
    accessToken: string,
    refreshToken: string,
    profile: any, // Contains user profile data from Google
    done: VerifyCallback,
  ): Promise<any> {
    console.log('--- GoogleStrategy.validate() called ---');
    console.log('Request Query (from Google callback):', req.query); // Log the entire query object received by validate
    console.log('Raw State parameter:', req.query.state); // Log the raw state parameter
    const { id, emails } = profile;
    const userEmail = emails && emails.length > 0 ? emails[0].value : null;

    // Extract userType from the state parameter
    let userType: string | undefined;
    if (req.query.state) {
      try {
        const stateDecoded = JSON.parse(
          decodeURIComponent(req.query.state as string),
        );
        userType = stateDecoded.userType;
        console.log('Decoded State object:', stateDecoded); // Log the decoded state object
        console.log('Extracted userType from state:', userType); // Log the extracted userType
      } catch (e) {
        console.error('Error parsing state parameter:', e);
        return done(new Error('Error parsing state parameter'), undefined);
      }
    } else {
      console.warn('State parameter is missing from the Google callback URL.');
      return done(
        new Error('State parameter is missing from the Google callback URL.'),
        undefined,
      );
    }

    if (!userEmail) {
      console.error('Google profile missing email:', profile);
      return done(new Error('Google profile missing email.'), undefined);
    }

    if (!userType) {
      console.error(
        'userType missing in Google login request query parameters.',
      );
      return done(
        new Error('User type is required for social login.'),
        undefined,
      );
    }

    try {
      // Pass the userType to your UserService
      const user = await this.userService.validateSocialUser(
        'google',
        id,
        userEmail,
        Number(userType),
      );
      done(null, user);
    } catch (err) {
      console.error('Error during Google social user validation:', err);
      done(err, false); // Pass the error to Passport, indicating authentication failure
    }
  }
}
