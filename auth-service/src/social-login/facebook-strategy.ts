import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-facebook";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserService } from "@Services/user.service";
import { Request } from "express"; // Import Request from express for type hinting

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, "facebook") {
  constructor(
    private configService: ConfigService,
    private userService: UserService
  ) {
    super({
      clientID: configService.get<string>("FACEBOOK_APP_ID")!,
      clientSecret: configService.get<string>("FACEBOOK_APP_SECRET")!,
      callbackURL: configService.get<string>("FACEBOOK_CALLBACK_URL")!, // Must match Facebook Developer settings
      profileFields: ["id", "emails", "name", "displayName"], // Request necessary profile fields
      scope: ["email", "public_profile"], // Request email and public profile access
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
    done: any
  ): Promise<any> {
    console.log("--- FacebookStrategy.validate() called ---");
    // Cast req to any to bypass TypeScript error if augmentation isn't working
    const requestWithQuery = req as any;
    console.log(
      "Request Query (from Facebook callback):",
      requestWithQuery.query
    ); // Log the entire query object received by validate
    console.log("Raw State parameter:", requestWithQuery.query.state); // Log the raw state parameter

    const { id, emails, displayName, name } = profile; // Destructure profile data
    const userEmail = emails && emails.length > 0 ? emails[0].value : null;

    // Robust way to get full name: prefer displayName, then combine given/family name
    const fullName =
      displayName ||
      (name && name.givenName && name.familyName
        ? `${name.givenName} ${name.familyName}`
        : "Facebook User");

    // Extract userType from the state parameter
    let userType = 0;
    if (requestWithQuery.query.state) {
      try {
        const stateDecoded = JSON.parse(
          decodeURIComponent(requestWithQuery.query.state as string)
        );
        userType = parseInt(stateDecoded.userType);
        console.log("Decoded State object:", stateDecoded);
        console.log("Extracted userType from state:", userType);
      } catch (e) {
        console.error("Error parsing state parameter for Facebook:", e);
      }
    } else {
      console.warn(
        "State parameter is missing from the Facebook callback URL."
      );
    }

    if (!userEmail) {
      console.error("Facebook profile missing email:", profile);
      return done(new Error("Facebook profile missing email."), null);
    }

    if (!userType) {
      console.error(
        "userType missing in Facebook login request (state parameter)."
      );
      return done(new Error("User type is required for social login."), null);
    }

    try {
      // Pass the userType to your UserService for Facebook provider
      const user = await this.userService.validateSocialUser(
        "facebook",
        id,
        userEmail,
        userType
      );
      done(null, user); // Pass the user object to the request (req.user)
    } catch (err) {
      console.error("Error during Facebook social user validation:", err);
      done(err, false); // Pass the error to Passport, indicating authentication failure
    }
  }
}
