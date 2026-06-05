import { prisma } from "../../lib/prisma.js";

class WishlistRepository {
  async getWishlist(userId: string) {
    return prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  include: { media: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async findOrCreateWishlist(userId: string) {
    let wishlist = await prisma.wishlist.findUnique({
      where: { userId },
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { userId },
      });
    }

    return wishlist;
  }

  async findProduct(productId: string) {
    return prisma.product.findUnique({
      where: {
        id: productId,
      },
    });
  }

  async findWishlistItem(wishlistId: string, productId: string) {
    return prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: { wishlistId, productId },
      },
    });
  }

  async createWishlistItem(wishlistId: string, productId: string) {
    return prisma.wishlistItem.create({
      data: { wishlistId, productId },
    });
  }

  async deleteWishlistItem(wishlistItemId: string) {
    return prisma.wishlistItem.delete({
      where: { id: wishlistItemId },
    });
  }

  async findWishlistItemById(wishlistItemId: string) {
    return prisma.wishlistItem.findUnique({
      where: { id: wishlistItemId },
    });
  }
}

export const wishlistRepository = new WishlistRepository();
