import { BadRequestError, ForbiddenError, NotFoundError } from "../../utils/errors/app-error.js";
import { cartRepository } from "./cart.repository.js";
import { offerService } from "../offers/offer.service.js";
import { applyOffersToProduct, getProductActiveOffer, calculateDiscountedPrice } from "../offers/offer-calculation.helper.js";

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

    const activeOffers = await offerService.getActiveOffers();
    cart.items = cart.items.map((item: any) => {
      if (item.variant && item.variant.product) {
        // Apply offer to the product
        item.variant.product = applyOffersToProduct(item.variant.product, activeOffers);
        // And override variant price based on the product's variant calculation
        const correspondingVariant = item.variant.product.variants?.find((v: any) => v.id === item.variantId);
        if (correspondingVariant) {
          item.variant.price = correspondingVariant.price;
          item.variant.basePrice = correspondingVariant.basePrice;
          item.variant.appliedOffer = correspondingVariant.appliedOffer;
        } else {
          // Fallback if variants are not populated on product details
          const baseVariantPrice = item.variant.price ? Number(item.variant.price) : Number(item.variant.product.price);
          const offer = getProductActiveOffer(item.variant.product, activeOffers);
          if (offer) {
            item.variant.basePrice = baseVariantPrice;
            item.variant.price = calculateDiscountedPrice(baseVariantPrice, offer);
            item.variant.appliedOffer = {
              id: offer.id,
              name: offer.name,
              discountType: offer.discountType,
              discountValue: Number(offer.discountValue),
            };
          } else {
            item.variant.basePrice = baseVariantPrice;
            item.variant.price = baseVariantPrice;
            item.variant.appliedOffer = null;
          }
        }
      }
      return item;
    });

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

