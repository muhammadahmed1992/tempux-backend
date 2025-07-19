import { HttpStatus, Injectable } from "@nestjs/common";
import ApiResponse from "@Helper/api-response";
import ResponseHelper from "@Helper/response-helper";
import { CartRepository } from "@Repository/cart.repository";
import { AddToCartRequestDTO } from "@DTO/add.to.cart.request.dto";
import { RemoveCartItemRequestDTO } from "@DTO/remove.cart.request.dto";
@Injectable()
export class CartService {
  constructor(private readonly repository: CartRepository) {}

  /**
   * This method will add user's product to the cart.
   * @param cart it is typeof AddToCartRequestDTO which contains userId, productId, product_variant_id, quantity
   * @returns newly marked cart id
   */
  async addProductToCart(
    cart: AddToCartRequestDTO
  ): Promise<ApiResponse<number>> {
    const result = (await this.repository.addProductInCart(cart)).id;
    return ResponseHelper.CreateResponse<number>(
      "",
      Number(result),
      HttpStatus.CREATED
    );
  }

  /**
   * This method is removing item from cart.
   * @param cart it is typeof RemoveCartItemRequestDTO which contains userId, productId, product_variant_id
   * @returns currently removed item from cart
   */
  async removeFromCart(
    cart: RemoveCartItemRequestDTO
  ): Promise<ApiResponse<number>> {
    const result = (await this.repository.removeFromCart(cart)).id;
    return ResponseHelper.CreateResponse<number>(
      "",
      Number(result),
      HttpStatus.NO_CONTENT
    );
  }
}
