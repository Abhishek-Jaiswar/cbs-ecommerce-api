import { prisma } from "../../lib/prisma.js";
import crypto from "node:crypto";
import type { TCartItemWithDetails, TCreateOrderDTO } from "./order.types.js";

class OrderRepository {
  async findOrders(page: number, limit: number) {
    const [items, total] = await prisma.$transaction([
      prisma.order.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.order.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit),
    };
  }

  async findOrderById(orderId: string) {
    return prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });
  }

  async findUserOrdersByUserId(userId: string) {
    return prisma.order.findMany({
      where: {
        userId,
      },
      include: {
        orderItems: true,
      },
    });
  }

  async findCartByUser(userId: string) {
    return prisma.cart.findUnique({
      where: {
        userId,
      },
      include: {
        items: true,
      },
    });
  }

  generateOrderNumber() {
    return `ZV-${new Date().getFullYear()}-${crypto.randomInt(100000, 999999)}`;
  }

  async createPendingOrder(userId: string, payload: TCreateOrderDTO, cartItems: TCartItemWithDetails[]) {
    return prisma.$transaction(async (tx) => {
      const orderNumber = this.generateOrderNumber();
      const { shippingAddress } = payload;

      if (!shippingAddress) {
        throw new Error("Shipping address is required to place an order");
      }

      // 1. Create the Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          fullname: shippingAddress.fullname,
          phoneNumber: shippingAddress.phoneNumber,
          addressLine1: shippingAddress.addressLine1,
          addressLine2: shippingAddress.addressLine2 ?? null,
          landmark: shippingAddress.landmark ?? null,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country,
          subtotalAmount: payload.subTotal,
          shippingAmount: payload.shippingAmount,
          taxAmount: payload.tax,
          discountAmount: payload.discount,
          totalAmount: payload.total,
          status: payload.status,
          paymentStatus: "PENDING",
        },
      });

      // 2. Create Order Items snapshot
      const orderItems = await tx.orderItem.createMany({
        data: cartItems.map((item) => ({
          orderId: order.id,
          productId: item.variant.product.id,
          variantId: item.variantId,
          name: item.variant.product.name,
          sku: item.variant.sku,
          image: item.variant.product.images[0]?.media.url || "",
          quantity: item.quantity,
          unitPrice: item.variant.price || item.variant.product.price,
          totalPrice: Number(item.variant.price || item.variant.product.price) * item.quantity,
        })),
      });

      // 3. Create the initial Payment record
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          provider: payload.paymentProvider,
          method: payload.paymentMethod,
          status: "PENDING",
          amount: payload.total,
        },
      });

      // 4. Create coupon redemption record and update coupon redeemed count if coupon was used
      if (payload.couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: payload.couponCode.toUpperCase() },
        });
        if (coupon) {
          await tx.couponRedemption.create({
            data: {
              couponId: coupon.id,
              userId,
              orderId: order.id,
              codeSnapshot: coupon.code,
              discountType: coupon.discountType,
              discountValue: coupon.discountValue,
              discountAmount: payload.discount,
            },
          });

          await tx.coupon.update({
            where: { id: coupon.id },
            data: {
              redeemedCount: {
                increment: 1,
              },
            },
          });
        }
      }

      return { order, payment };
    });
  }

  async fulfillOrderStockAndClearCart(
    userId: string,
    cartId: string,
    orderItems: { variantId: string | null; quantity: number }[]
  ) {
    return prisma.$transaction(async (tx) => {
      for (const item of orderItems) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: {
              id: item.variantId,
            },
            data: {
              stock: { decrement: item.quantity },
            },
          });
        }
      }

      await tx.cartItem.deleteMany({
        where: {
          cartId,
        },
      });
    });
  }
}

export const orderRepository = new OrderRepository();
