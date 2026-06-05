import { prisma } from "../../lib/prisma.js";

class CartRepository {
  async getUserCart(userId: string) {
    return prisma.cart.findUnique({
      where: {
        userId,
      },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: {
                      include: {
                        media: true,
                      },
                    },
                  },
                },
                color: true,
                size: true,
              },
            },
          },
        },
      },
    });
  }

  async findOrCreateCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    return cart;
  }

  async addToCart(cartId: string, variantId: string, quantity: number) {
    return prisma.cartItem.upsert({
      where: {
        cartId_variantId: {
          cartId,
          variantId,
        },
      },
      create: {
        cartId,
        variantId,
        quantity,
      },
      update: {
        quantity: {
          increment: quantity,
        },
      },
    });
  }

  async updateQuantity(cartItemId: string, quantity: number) {
    if (quantity <= 0) {
      return prisma.cartItem.delete({
        where: { id: cartItemId },
      });
    }

    return prisma.cartItem.update({
      where: {
        id: cartItemId,
      },
      data: {
        quantity,
      },
    });
  }

  async removeCartItem(cartItemId: string) {
    return prisma.cartItem.delete({
      where: {
        id: cartItemId,
      },
    });
  }

  async clearCart(cartId: string) {
    return prisma.cartItem.deleteMany({
      where: {
        cartId,
      },
    });
  }

  async findProductVariant(variantId: string) {
    return prisma.productVariant.findUnique({
      where: {
        id: variantId,
      },
    });
  }

  async findCartItem(cartItemId: string) {
    return prisma.cartItem.findUnique({
      where: {
        id: cartItemId,
      },
    });
  }
}

export const cartRepository = new CartRepository();
