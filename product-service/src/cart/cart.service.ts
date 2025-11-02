import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import ApiResponse from '@Helper/api-response';
import ResponseHelper from '@Helper/response-helper';
import { CartRepository } from './cart.repository';
import { AddToCartRequestDTO } from '@DTO/add-to-cart-request.dto';
import { RemoveCartItemRequestDTO } from '@DTO/remove-cart-request.dto';
import { CartDetailsResponseDTO } from '@DTO/cart-details-response.dto';
import Constants from '@Helper/constants';
import { AppLoggerService } from '@Common/logging';
import { ProductService } from '@Product/product.service';
@Injectable()
export class CartService {
  constructor(
    private readonly repository: CartRepository,
    private readonly logger: AppLoggerService,
    private readonly productService: ProductService,
  ) {}

  /**
   * This method will add user's product to the cart.
   * @param cart it is typeof AddToCartRequestDTO which contains userId, productId, quantity
   * @returns newly marked cart id
   */
  async addProductToCart(
    cart: AddToCartRequestDTO,
  ): Promise<ApiResponse<number>> {
    const stockExistanceValidation =
      await this.productService.checkIfStockAvailable(
        cart.productId,
        cart.quantity,
      );

    if (!stockExistanceValidation)
      throw new BadRequestException(
        `Product doesn't have such quantity available in the stock`,
      );
    const result = (await this.repository.addProductInCart(cart)).id;
    return ResponseHelper.CreateResponse<number>(
      '',
      Number(result),
      HttpStatus.CREATED,
    );
  }

  /**
   * This method is removing item from cart.
   * @param cart it is typeof RemoveCartItemRequestDTO which contains userId, productId
   * @returns currently removed item from cart
   */
  async removeFromCart(
    userId: bigint,
    cart: RemoveCartItemRequestDTO[],
  ): Promise<ApiResponse<number>> {
    const result = await this.repository.removeFromCart(userId, cart);
    return ResponseHelper.CreateResponse<number>(
      '',
      Number(result.count),
      HttpStatus.OK,
    );
  }

  /**
   * Fetches cart detailed information of a user..
   *
   * @param userId The ID of the user (BigInt).
   * @param page This is the current page number and by default it is 1
   * @param pageSize This is the current pageSize by default it is 100000
   * @returns The Product Title, Name, Reference Color Size Quantity, Price, CartId to remove if needed.
   */
  async fetchCartInformation(
    userId: bigint,
    page: number,
    pageSize: number,
    where?: object,
    select?: object,
    order?: object,
  ): Promise<ApiResponse<CartDetailsResponseDTO[]>> {
    const { data, totalCount } =
      await this.repository.getCartDetailedInfomration(
        userId,
        page,
        pageSize,
        where,
        select,
        order,
      );
    if (!totalCount)
      ResponseHelper.CreateResponse<CartDetailsResponseDTO[]>(
        Constants.NO_CART_DATA_FOUND,
        [],
        HttpStatus.OK,
      );
    // Map the raw Prisma result to the CartDetailsResponseDTO format
    const detailedCartItems: CartDetailsResponseDTO[] = data
      .map((item) => {
        // Perform null/undefined checks for nested relations to ensure data integrity
        // These checks are crucial for type safety and preventing runtime errors
        if (
          !item.product ||
          !item.product.productImages ||
          !item.product.productImages[0]
        ) {
          // Log a warning if data is inconsistent, or handle as per application's error policy
          this.logger.warn(
            `Cart item ${item.id} has missing product or image data.`,
          );
          return null; // Return null for this item, which will be filtered out later
        }

        // Return the shaped object conforming to CartDetailsResponseDTO
        return {
          id: item.id, // This is the ID of the cart entry itself
          productId: item.product.id,
          productName: item.product.name,
          productTitle: item.product.title,
          reference_number: item.product.reference_number,
          base_image_url: item.product.productImages[0].img_url,
          price: item.product.sales_price.toNumber(),
          size: 'N/A', // Size information not available in simplified schema
          color: 'N/A', // Color information not available in simplified schema
          quantity: item.quantity,
        };
      })
      .filter((item) => item != null);
    this.logger.log({
      message: 'Detailed cart Items',
      context: { detailedCartItems },
    });
    return ResponseHelper.CreateResponse(
      '',
      detailedCartItems,
      HttpStatus.ACCEPTED,
      {
        pageNumber: page,
        pageSize: pageSize,
        totalCount,
        numberOfTotalPages: Math.ceil(totalCount / pageSize),
      },
    );
  }
}
