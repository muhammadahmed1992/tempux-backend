import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { RateQuoteRequest } from './shipping.service';
import ApiResponse from '../common/helper/api-response';
import ResponseHelper from '../common/helper/response-helper';
import { AuthUserGuard } from '../auth/guards/auth-user-guard';

@Controller('shipments')
@UseGuards(AuthUserGuard)
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('rate-quote')
  async getRateQuote(
    @Body() rateQuoteRequest: RateQuoteRequest,
  ): Promise<ApiResponse<any>> {
    const rateQuote = await this.shippingService.getRateQuote(rateQuoteRequest);
    return ResponseHelper.CreateResponse(
      'Rate quote obtained successfully',
      rateQuote,
      HttpStatus.OK,
    );
  }

  @Get(':trackingNumber/tracking')
  async getShipmentTracking(
    @Param('trackingNumber') trackingNumber: string,
  ): Promise<ApiResponse<any>> {
    const trackingInfo = await this.shippingService.getShipmentTracking(
      trackingNumber,
    );
    return ResponseHelper.CreateResponse(
      'Tracking information retrieved successfully',
      trackingInfo,
      HttpStatus.OK,
    );
  }
}
