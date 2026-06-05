import { BadRequestError, ForbiddenError, NotFoundError } from "../../utils/errors/app-error.js";
import { wishlistRepository } from "./wishlist.repository.js";
import { prisma } from "../../lib/prisma.js";

class WishlistService {
  async getUserWishlist(userId: string) {
    if (!userId) {
      throw new BadRequestError("User ID is required");
    }

    await wishlistRepository.findOrCreateWishlist(userId);
    const wishlist = await wishlistRepository.getWishlist(userId);
    if (!wishlist) {
      throw new NotFoundError("Wishlist could not be retrieved");
    }

    return wishlist;
  }

  async toggleWishlistItem(userId: string, productId: string) {
    if (!userId) {
      throw new BadRequestError("User ID is required");
    }

    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    const wishlist = await wishlistRepository.findOrCreateWishlist(userId);
    const existingItem = await wishlistRepository.findWishlistItem(wishlist.id, productId);

    if (existingItem) {
      await wishlistRepository.deleteWishlistItem(existingItem.id);
      return { liked: false, message: "Removed from wishlist" };
    } else {
      await wishlistRepository.createWishlistItem(wishlist.id, productId);
      return { liked: true, message: "Added to wishlist" };
    }
  }

  async removeWishlistItem(userId: string, wishlistItemId: string) {
    if (!userId) {
      throw new BadRequestError("User ID is required");
    }

    const wishlistItem = await wishlistRepository.findWishlistItemById(wishlistItemId);
    if (!wishlistItem) {
      throw new NotFoundError("Wishlist item not found");
    }

    const wishlist = await wishlistRepository.findOrCreateWishlist(userId);
    if (wishlistItem.wishlistId !== wishlist.id) {
      throw new ForbiddenError("You cannot modify this wishlist item");
    }

    await wishlistRepository.deleteWishlistItem(wishlistItemId);
    return { success: true };
  }
}

export const wishlistService = new WishlistService();
