import { Injectable, BadRequestException } from '@nestjs/common';
import { HashidsService } from '@HashIds/hashids.service'; // adjust path

@Injectable()
export class ProductIdResolver {
  constructor(private readonly hashidsService: HashidsService) {}

  resolve(hashid: string): number {
    const decoded = this.hashidsService.decode(hashid);
    if (!decoded) {
      throw new BadRequestException(`Invalid product_public_id: ${hashid}`);
    }
    return Number(decoded);
  }
}
