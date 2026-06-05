import { BadRequestError, ForbiddenError, NotFoundError } from "../../utils/errors/app-error.js";
import { cartRepository } from "./cart.repository.js";

class CartService {
  async getUserCart(userId: string) {
    if (!userId) {
      throw new BadRequestError("User ID is required");
    }

    // Auto-create cart if it doesn't exist yet
    await cartRepository.findOrCreateCart(userId);

    const cart = await cartRepository.getUserCart(userId);
    if (!cart) {
      throw new NotFoundError("Cart could not be retrieved");
    }

    return cart;
  }

  async addToCart(userId: string, variantId: string, quantity: number) {
    if (!userId) {
      throw new BadRequestError("User ID is required");
    }

    const variant = await cartRepository.findProductVariant(variantId);
    if (!variant) {
      throw new NotFoundError("Product variant not found");
    }

    if (variant.stock < quantity) {
      throw new BadRequestError(`Insufficient stock. Only ${variant.stock} items available.`);
    }

    const cart = await cartRepository.findOrCreateCart(userId);

    return cartRepository.addToCart(cart.id, variantId, quantity);
  }

  async updateCartItemQuantity(userId: string, cartItemId: string, quantity: number) {
    if (!userId) {
      throw new BadRequestError("User ID is required");
    }

    const cartItem = await cartRepository.findCartItem(cartItemId);
    if (!cartItem) {
      throw new NotFoundError("Cart item not found");
    }

    const cart = await cartRepository.findOrCreateCart(userId);
    if (cartItem.cartId !== cart.id) {
      throw new ForbiddenError("You cannot modify this cart item");
    }

    if (quantity > 0) {
      const variant = await cartRepository.findProductVariant(cartItem.variantId);
      if (variant && variant.stock < quantity) {
        throw new BadRequestError(`Insufficient stock. Only ${variant.stock} items available.`);
      }
    }

    return cartRepository.updateQuantity(cartItemId, quantity);
  }

  async removeCartItem(userId: string, cartItemId: string) {
    if (!userId) {
      throw new BadRequestError("User ID is required");
    }

    const cartItem = await cartRepository.findCartItem(cartItemId);
    if (!cartItem) {
      throw new NotFoundError("Cart item not found");
    }

    const cart = await cartRepository.findOrCreateCart(userId);
    if (cartItem.cartId !== cart.id) {
      throw new ForbiddenError("You cannot modify this cart item");
    }

    await cartRepository.removeCartItem(cartItemId);
    return { success: true };
  }

  async clearCart(userId: string) {
    if (!userId) {
      throw new BadRequestError("User ID is required");
    }

    const cart = await cartRepository.findOrCreateCart(userId);
    await cartRepository.clearCart(cart.id);
    return { success: true };
  }
}

export const cartService = new CartService();

