import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Patch,
  Delete,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserService } from './services/user.service';
import { AddressService } from './services/address.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dtos/create.user.dto';
import ApiResponse from '@Helper/api-response';
import { LoginRequestDTO } from './dtos/login-request.dto';
import { LoginDTO } from './dtos/login.dto';
import { OTPVerificationRequestDTO } from './dtos/otp.verification.dto';
import { ResendOTPDTO, ResetPasswordRequestDTO } from './dtos/resend.otp.dto';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { EmailTemplateType } from '@Email/factory/email.template.type';
import { ForgotPasswordDTO } from './dtos/update.password.dto';
import { AuthCookieInterceptor } from './interceptor/auth.cookie.interceptor';
import { SocialLoginService } from './services/social-login.service';
import { SocialAuthRedirectInterceptor } from './interceptor/social-auth-redirect.interceptor';
import ResponseHelper from '@Helper/response-helper';
import CookieHelper from './helper/cookie.helper';
import { ProviderType } from './dtos/user.details.response.dto';
import { HeaderAuthGuard } from 'src/auth/guards/auth-user-guard';
import {
  CreateAddressDto,
  UpdateAddressDto,
  ValidateAddressOwnershipDto,
} from './dtos/address.dto';
import { AppLoggerService } from '../common/logging/logger.service';
import { LogoutCookieInterceptor } from './interceptor/logout.cookie.interceptor';
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly addressService: AddressService,
    private readonly prisma: PrismaService,
    private readonly socialLoginService: SocialLoginService,
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {}

  @Post('register')
  async create(@Body() user: CreateUserDto): Promise<ApiResponse<boolean>> {
    return await this.userService.create(user);
  }

  @Post('login')
  @UseInterceptors(AuthCookieInterceptor)
  async login(
    @Body() login: LoginRequestDTO,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<LoginDTO>> {
    return this.userService.login(login);
  }

  @Post('verify-otp')
  async verify(
    @Body() verify: OTPVerificationRequestDTO,
  ): Promise<ApiResponse<boolean>> {
    return await this.userService.verifyOTP(verify);
  }

  @Post('resend-otp')
  async resendOTP(@Body() resend: ResendOTPDTO): Promise<ApiResponse<boolean>> {
    if (!resend.token) throw new BadRequestException('Invalid otp reset token');
    return this.userService.resendOTP(
      resend,
      EmailTemplateType.OTP_VERIFICATION,
    );
  }

  @Post('reset/password')
  async generatePasswordResetLink(
    @Body() resend: ResetPasswordRequestDTO,
  ): Promise<ApiResponse<boolean>> {
    return this.userService.generateResetPasswordLink(
      resend,
      EmailTemplateType.PASSWORD_RESET,
    );
  }

  @Put('password')
  async forgotPassword(
    @Body() request: ForgotPasswordDTO,
  ): Promise<ApiResponse<boolean>> {
    if (request.newPassword !== request.confirmPassword) {
      throw new BadRequestException('New and confirm password must match');
    }
    return await this.userService.forgotPassword(request);
  }

  // Google Auth
  @Get('google')
  async googleAuth(@Req() req: Request, @Res() res: Response) {
    this.logger.debug({
      message: 'AuthController.googleAuth initial request',
      context: { operation: 'oauth_redirect', provider: 'google' },
    });
    const url = (req.headers['x-client-origin'] || '') as string;
    const redirectUrl = this.socialLoginService.getGoogleLoginUrl(url);
    this.logger.debug({
      message: 'Generated Google Auth URL',
      context: { operation: 'oauth_redirect', provider: 'google', redirectUrl },
    });
    return res.redirect(redirectUrl);
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @UseInterceptors(SocialAuthRedirectInterceptor, AuthCookieInterceptor)
  async googleAuthRedirect() {
    this.logger.debug({
      message: 'Google callback endpoint hit',
      context: { operation: 'oauth_callback', provider: 'google' },
    });
  }

  /**
   * Initiates the Facebook OAuth2 login flow.
   * Frontend calls: GET http://localhost:3001/user/facebook
   * This endpoint manually constructs the Facebook OAuth URL with a 'state' parameter.
   */
  @Get('facebook')
  async facebookAuth(@Req() req: Request, @Res() res: Response) {
    this.logger.debug({
      message: 'AuthController.facebookAuth initial request',
      context: { operation: 'oauth_redirect', provider: 'facebook' },
    });
    const url = (req.headers['x-client-origin'] || '') as string;
    const redirectUrl = this.socialLoginService.getFacebookLoginUrl(url);
    this.logger.debug({
      message: 'Generated Facebook Auth URL',
      context: {
        operation: 'oauth_redirect',
        provider: 'facebook',
        redirectUrl,
      },
    });

    return res.redirect(redirectUrl);
  }

  /**
   * Handles the callback from Facebook after user authentication.
   * Facebook redirects the user back to this endpoint. Passport's FacebookStrategy
   * processes the response and populates `req.user`.
   */
  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook')) // Use AuthGuard for 'facebook' strategy
  @UseInterceptors(SocialAuthRedirectInterceptor, AuthCookieInterceptor)
  async facebookAuthRedirect() {
    this.logger.debug({
      message: 'Facebook callback endpoint hit',
      context: { operation: 'oauth_callback', provider: 'facebook' },
    });
  }

  @Post('details-by-ids')
  async getUsersDetailsByIdsPost(@Body('ids') userIds: number[]) {
    // This is generally preferred for a large number of IDs.
    return this.userService.findUsersByIds(userIds);
  }

  @Post('map')
  async mapWithExistingAccount(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body('email') email: string,
  ) {
    const provider = CookieHelper.getCookieValue(
      req,
      'provider',
    ) as ProviderType;
    const socialEmail =
      CookieHelper.getCookieValue(req, 'ue') &&
      decodeURIComponent(CookieHelper.getCookieValue(req, 'ue')!);

    if (!provider || !socialEmail) {
      this.clearCookies(res);
      throw new UnauthorizedException(
        'Your session has been expired. Please re-login again',
      );
    }

    return this.userService.mapWithExistingAccount(
      email,
      socialEmail,
      provider,
    );
  }

  @Post('register/predefined-user')
  async predefinedUser(@Body() email: string): Promise<ApiResponse<boolean>> {
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Invalid email address');
    }

    return this.userService.create({
      email,
      password: 'SOCIAL_LOGIN_PASSWORD_PLACEH',
      username: 'SOCIAL',
      fullName: 'SOCIAL_LOGIN_USERNAME',
    });
  }

  @Post('social-media')
  async createUserBySocialMedia(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const provider = CookieHelper.getCookieValue(
      req,
      'provider',
    ) as ProviderType;
    const socialEmail = decodeURIComponent(
      CookieHelper.getCookieValue(req, 'ue')!,
    );
    this.logger.debug({
      message: 'Social media user email decoded',
      context: { operation: 'social_login', email: socialEmail },
    });
    if (!provider || !socialEmail) {
      this.clearCookies(res);
      throw new UnauthorizedException(
        'Your session has been expired. Please re-login again',
      );
    }

    const result = await this.userService.createUserBySocialLoginEmail(
      socialEmail,
      provider,
    );

    return result;
  }

  @UseGuards(HeaderAuthGuard)
  @Get('/me')
  /**
   * @returns It will returns logged-in user's display name and profileImageUrl.
   */
  public async me(@Req() request: Request & { user?: JwtUser }) {
    if (!request.user) throw new UnauthorizedException();
    return this.userService.getProfile(request.user.id);
  }

  @UseGuards(HeaderAuthGuard)
  @UseInterceptors(LogoutCookieInterceptor)
  @Post('logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return ResponseHelper.CreateResponse<any>(
      'You have been successfully logout',
      null,
      HttpStatus.OK,
    );
  }

  // Address endpoints
  @UseGuards(HeaderAuthGuard)
  @Post('addresses')
  async createAddress(
    @Req() request: Request & { user?: JwtUser },
    @Body() createAddressDto: CreateAddressDto,
  ): Promise<ApiResponse<any>> {
    if (!request.user) throw new UnauthorizedException();
    const result = await this.addressService.createAddress(
      request.user.id,
      createAddressDto,
    );
    return ResponseHelper.CreateResponse<any>(
      'Address created successfully',
      result,
      HttpStatus.CREATED,
    );
  }

  @UseGuards(HeaderAuthGuard)
  @Get('addresses/:addressId')
  async findAddressById(
    @Req() request: Request & { user?: JwtUser },
    @Param('addressId') addressId: string,
  ): Promise<ApiResponse<any>> {
    if (!request.user) throw new UnauthorizedException();

    const addressIdBigInt = BigInt(addressId);
    const result = await this.addressService.findAddressById(
      addressIdBigInt,
      request.user.id,
    );
    return ResponseHelper.CreateResponse<any>(
      'Address retrieved successfully',
      result,
      HttpStatus.OK,
    );
  }

  @Post('addresses/context/:context')
  async findUserAddressesByContext(
    @Param('context') context: 'buyer' | 'seller',
    @Body() body: { userId: string | number },
  ): Promise<ApiResponse<any>> {
    const bigIntUserId = BigInt(body.userId);

    const result = await this.addressService.findUserAddressesByContext(
      bigIntUserId,
      context,
    );
    return ResponseHelper.CreateResponse<any>(
      'Addresses retrieved successfully',
      result,
      HttpStatus.OK,
    );
  }

  @Get('addresses/default/:addressType')
  async getDefaultAddressByType(
    @Req() request: Request & { user?: JwtUser },
    @Param('addressType') addressType: string,
  ): Promise<ApiResponse<any>> {
    if (!request.user) throw new UnauthorizedException();
    const result = await this.addressService.getDefaultAddressByType(
      request.user.id,
      addressType,
    );
    return ResponseHelper.CreateResponse<any>(
      'Default address retrieved successfully',
      result,
      HttpStatus.OK,
    );
  }

  @UseGuards(HeaderAuthGuard)
  @Post('addresses/order-addresses')
  async getOrderAddresses(
    @Body() body: { buyerId: number | bigint; sellerId: number | bigint },
  ): Promise<ApiResponse<any>> {
    const result = await this.addressService.getOrderAddresses(
      BigInt(body.buyerId),
      BigInt(body.sellerId),
    );
    return ResponseHelper.CreateResponse<any>(
      'Order addresses retrieved successfully',
      result,
      HttpStatus.OK,
    );
  }

  @UseGuards(HeaderAuthGuard)
  @Post('addresses/validate-ownership')
  async validateAddressOwnership(
    @Body() validateDto: ValidateAddressOwnershipDto,
  ): Promise<ApiResponse<boolean>> {
    const result = await this.addressService.validateAddressOwnership(
      BigInt(validateDto.addressId),
      BigInt(validateDto.userId),
      validateDto.expectedType,
    );
    return ResponseHelper.CreateResponse<boolean>(
      'Address ownership validated',
      result,
      HttpStatus.OK,
    );
  }

  // PROFILE Endpoints

  @UseGuards(HeaderAuthGuard)
  @Patch('profile/update')
  async updateProfile(
    @Req() request: Request & { user?: JwtUser },
    @Body() updateData: any,
  ): Promise<ApiResponse<any>> {
    if (!request.user) throw new UnauthorizedException();
    return this.userService.updateProfile(request.user.id, updateData);
  }

  @UseGuards(HeaderAuthGuard)
  @Get('profile/summary')
  async getProfileSummary(
    @Req() request: Request & { user?: JwtUser },
  ): Promise<ApiResponse<any>> {
    if (!request.user) throw new UnauthorizedException();
    return this.userService.getProfileSummary(request.user.id);
  }

  @UseGuards(HeaderAuthGuard)
  @Get('profile/billing-address')
  async getBillingAddress(
    @Req() request: Request & { user?: JwtUser },
  ): Promise<ApiResponse<any>> {
    if (!request.user) throw new UnauthorizedException();
    try {
      const billingAddress = await this.addressService.getDefaultAddressByType(
        request.user.id,
        'BILLING',
      );
      return ResponseHelper.CreateResponse<any>(
        'Billing address retrieved successfully',
        billingAddress,
        HttpStatus.OK,
      );
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        return ResponseHelper.CreateResponse<any>(
          'No billing address found',
          null,
          HttpStatus.OK,
        );
      }
      throw error;
    }
  }

  @UseGuards(HeaderAuthGuard)
  @Patch('profile/billing-address')
  async updateBillingAddress(
    @Req() request: Request & { user?: JwtUser },
    @Body() addressData: CreateAddressDto,
  ): Promise<ApiResponse<any>> {
    if (!request.user) throw new UnauthorizedException();

    // First, try to find existing billing address
    let existingAddress;
    try {
      existingAddress = await this.addressService.getDefaultAddressByType(
        request.user.id,
        'BILLING',
      );
    } catch (error) {
      // No existing address found, will create new one
    }

    if (existingAddress) {
      // For now, we'll create a new billing address since there's no update method
      // In a real implementation, you would add an updateAddress method to AddressService
      const newAddress = await this.addressService.createAddress(
        request.user.id,
        {
          ...addressData,
          addressType: 'BILLING',
        },
      );
      return ResponseHelper.CreateResponse<any>(
        'Billing address updated successfully',
        newAddress,
        HttpStatus.OK,
      );
    } else {
      // Create new billing address
      const newAddress = await this.addressService.createAddress(
        request.user.id,
        {
          ...addressData,
          addressType: 'BILLING',
        },
      );
      return ResponseHelper.CreateResponse<any>(
        'Billing address created successfully',
        newAddress,
        HttpStatus.CREATED,
      );
    }
  }

  @UseGuards(HeaderAuthGuard)
  @Get('profile/login-info')
  async getLoginInfo(
    @Req() request: Request & { user?: JwtUser },
  ): Promise<ApiResponse<any>> {
    if (!request.user) throw new UnauthorizedException();
    return this.userService.getLoginInfo(request.user.id);
  }


  @UseGuards(HeaderAuthGuard)
  @Get('profile/social-accounts')
  async getSocialAccounts(
    @Req() request: Request & { user?: JwtUser },
  ): Promise<ApiResponse<any>> {
    if (!request.user) throw new UnauthorizedException();
    return this.userService.getSocialAccounts(request.user.id);
  }

  // ========== SAVED SEARCHES ENDPOINTS ==========

  @UseGuards(HeaderAuthGuard)
  @Get('profile/saved-searches')
  async getSavedSearches(
    @Req() request: Request & { user?: JwtUser },
  ): Promise<ApiResponse<any[]>> {
    if (!request.user) throw new UnauthorizedException();

    try {
      const savedSearches = await this.prisma.savedSearch.findMany({
        where: {
          user_id: request.user.id,
          is_deleted: false,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      const searches = savedSearches.map((search) => ({
        id: search.id,
        userId: search.user_id,
        title: (search.search_query as any)?.title || 'Untitled Search',
        searchQuery: search.search_query,
        description: (search.search_query as any)?.description,
        createdAt: search.created_at || new Date(),
      }));

      return ResponseHelper.CreateResponse<any[]>(
        'Saved searches retrieved successfully',
        searches,
        HttpStatus.OK,
      );
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to get saved searches',
        context: {
          userId: request.user.id.toString(),
          operation: 'get_saved_searches',
        },
        error: error as Error,
      });
      throw new InternalServerErrorException(
        'Failed to retrieve saved searches',
      );
    }
  }

  @UseGuards(HeaderAuthGuard)
  @Post('profile/saved-searches')
  async createSavedSearch(
    @Req() request: Request & { user?: JwtUser },
    @Body() searchData: any,
  ): Promise<ApiResponse<any>> {
    if (!request.user) throw new UnauthorizedException();

    try {
      const searchQuery = {
        ...searchData.searchQuery,
        title: searchData.title,
        description: searchData.description,
      };

      const savedSearch = await this.prisma.savedSearch.create({
        data: {
          user_id: request.user.id,
          search_query: searchQuery,
        },
      });

      const response = {
        id: savedSearch.id,
        userId: savedSearch.user_id,
        title: searchData.title,
        searchQuery: savedSearch.search_query,
        description: searchData.description,
        createdAt: savedSearch.created_at || new Date(),
      };

      return ResponseHelper.CreateResponse<any>(
        'Saved search created successfully',
        response,
        HttpStatus.CREATED,
      );
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to create saved search',
        context: {
          userId: request.user.id.toString(),
          operation: 'create_saved_search',
        },
        error: error as Error,
      });
      throw new InternalServerErrorException('Failed to create saved search');
    }
  }

  @UseGuards(HeaderAuthGuard)
  @Patch('profile/saved-searches/:searchId')
  async updateSavedSearch(
    @Req() request: Request & { user?: JwtUser },
    @Param('searchId') searchId: string,
    @Body() updateData: any,
  ): Promise<ApiResponse<any>> {
    if (!request.user) throw new UnauthorizedException();

    try {
      // Verify ownership
      const existingSearch = await this.prisma.savedSearch.findFirst({
        where: {
          id: BigInt(searchId),
          user_id: request.user.id,
          is_deleted: false,
        },
      });

      if (!existingSearch) {
        throw new NotFoundException('Saved search not found');
      }

      const searchQuery = {
        ...(existingSearch.search_query as any),
        ...(updateData.searchQuery || {}),
        ...(updateData.title && { title: updateData.title }),
        ...(updateData.description && { description: updateData.description }),
      };

      const updatedSearch = await this.prisma.savedSearch.update({
        where: { id: BigInt(searchId) },
        data: {
          search_query: searchQuery,
        },
      });

      const response = {
        id: updatedSearch.id,
        userId: updatedSearch.user_id,
        title:
          updateData.title || (searchQuery as any).title || 'Untitled Search',
        searchQuery: updatedSearch.search_query,
        description: updateData.description || (searchQuery as any).description,
        createdAt: updatedSearch.created_at || new Date(),
      };

      return ResponseHelper.CreateResponse<any>(
        'Saved search updated successfully',
        response,
        HttpStatus.OK,
      );
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error({
        message: 'Failed to update saved search',
        context: {
          userId: request.user.id.toString(),
          searchId,
          operation: 'update_saved_search',
        },
        error: error as Error,
      });
      throw new InternalServerErrorException('Failed to update saved search');
    }
  }

  @UseGuards(HeaderAuthGuard)
  @Delete('profile/saved-searches/:searchId')
  async deleteSavedSearch(
    @Req() request: Request & { user?: JwtUser },
    @Param('searchId') searchId: string,
  ): Promise<ApiResponse<boolean>> {
    if (!request.user) throw new UnauthorizedException();

    try {
      // Verify ownership
      const existingSearch = await this.prisma.savedSearch.findFirst({
        where: {
          id: BigInt(searchId),
          user_id: request.user.id,
          is_deleted: false,
        },
      });

      if (!existingSearch) {
        throw new NotFoundException('Saved search not found');
      }

      await this.prisma.savedSearch.update({
        where: { id: BigInt(searchId) },
        data: { is_deleted: true },
      });

      return ResponseHelper.CreateResponse<boolean>(
        'Saved search deleted successfully',
        true,
        HttpStatus.OK,
      );
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error({
        message: 'Failed to delete saved search',
        context: {
          userId: request.user.id.toString(),
          searchId,
          operation: 'delete_saved_search',
        },
        error: error as Error,
      });
      throw new InternalServerErrorException('Failed to delete saved search');
    }
  }

  // NEWSLETTER ENDPOINTS
  // TODO : will implement it dynamically
  @UseGuards(HeaderAuthGuard)
  @Post('profile/newsletter/subscribe')
  async subscribeNewsletter(
    @Req() request: Request & { user?: JwtUser },
    @Body() subscriptionData: any,
  ): Promise<ApiResponse<any>> {
    if (!request.user) throw new UnauthorizedException();

    try {
      const response = {
        isSubscribed: true,
        email: subscriptionData.email,
        subscribedAt: new Date(),
        preferences: subscriptionData.preferences
          ? JSON.parse(subscriptionData.preferences)
          : {},
      };

      this.logger.log({
        message: 'Newsletter subscription request',
        context: {
          userId: request.user.id.toString(),
          email: subscriptionData.email,
          operation: 'newsletter_subscribe',
        },
      });

      return ResponseHelper.CreateResponse<any>(
        'Newsletter subscription successful',
        response,
        HttpStatus.OK,
      );
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to subscribe to newsletter',
        context: {
          userId: request.user.id.toString(),
          operation: 'newsletter_subscribe',
        },
        error: error as Error,
      });
      throw new InternalServerErrorException(
        'Failed to subscribe to newsletter',
      );
    }
  }

  @UseGuards(HeaderAuthGuard)
  @Delete('profile/newsletter/unsubscribe')
  async unsubscribeNewsletter(
    @Req() request: Request & { user?: JwtUser },
    @Body() body: { email: string },
  ): Promise<ApiResponse<boolean>> {
    if (!request.user) throw new UnauthorizedException();

    try {

      this.logger.log({
        message: 'Newsletter unsubscription request',
        context: {
          userId: request.user.id.toString(),
          email: body.email,
          operation: 'newsletter_unsubscribe',
        },
      });

      return ResponseHelper.CreateResponse<boolean>(
        'Newsletter unsubscription successful',
        true,
        HttpStatus.OK,
      );
    } catch (error: any) {
      this.logger.error({
        message: 'Failed to unsubscribe from newsletter',
        context: {
          userId: request.user.id.toString(),
          operation: 'newsletter_unsubscribe',
        },
        error: error as Error,
      });
      throw new InternalServerErrorException(
        'Failed to unsubscribe from newsletter',
      );
    }
  }

  // TODO: Will fix typings
  private async clearCookies(res: any) {
    const dns = this.configService.get<string>('DNS')!;

    // We need to clear cookies explicitly so that passing exact params which were used while during creation.
    CookieHelper.clearCookies(res as any, 'access_token', 'strict', true, dns);
    CookieHelper.clearCookies(res as any, 'ue', 'strict', false, dns);
    CookieHelper.clearCookies(res as any, 'provider', 'strict', false, dns);
  }
}

interface JwtUser {
  id: bigint;
  email: string;
}
