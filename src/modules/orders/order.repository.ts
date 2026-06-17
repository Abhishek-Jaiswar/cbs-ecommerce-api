import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { TCartItem, TCreateOrder } from "./order.types.js";

class OrderReposity {
  async findOrders(page: number, limit: number) {
    const [items, total] = await prisma.$transaction([
      prisma.order.findMany({
        take: limit,
        skip: (page - 1) * limit,
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
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOrderById(orderId: string) {
    return prisma.order.findUnique({
      where: {
        id: orderId,
      },

      include: {
        orderItems: true,
        payments: true,
      },
    });
  }

  async findUserOrderByUserId(userId: string, page: number, limit: number) {
    const [items, total] = await prisma.$transaction([
      prisma.order.findMany({
        where: {
          userId,
        },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          orderItems: true,
        },
      }),

      prisma.order.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createPendingOrder(userId: string, payload: TCreateOrder, cartItems: TCartItem[]) {
    return prisma.$transaction(async (tx) => {
      const { shippingAddress: shippingAdd } = payload;
      if (!shippingAdd) {
        throw new Error("Shipping address is required to place an order");
      }
      const order = await tx.order.create({
        data: {
          userId,
          orderNumber: payload.orderNumber,
          trackingNumber: payload.trackingNumber,
          fullname: shippingAdd.fullname,
          phoneNumber: shippingAdd.phoneNumber,
          addressLine1: shippingAdd.addressLine1,
          addressLine2: shippingAdd.addressLine2 ?? null,
          landmark: shippingAdd.landmark ?? null,
          city: shippingAdd.city,
          state: shippingAdd.state,
          postalCode: shippingAdd.postalCode,
          country: shippingAdd.country,
          subtotalAmount: payload.subTotal,
          shippingAmount: payload.shippingAmount,
          taxAmount: payload.tax,
          discountAmount: payload.discount,
          totalAmount: payload.total,
          status: payload.status,
          paymentStatus: "PENDING",
          utmSource: payload.utmSource ?? null,
          utmMedium: payload.utmMedium ?? null,
          utmCampaign: payload.utmCampaign ?? null,
          utmTerm: payload.utmTerm ?? null,
          utmContent: payload.utmContent ?? null,
        },
      });

      await tx.orderItem.createMany({
        data: cartItems.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          sku: item.sku ?? null,
          image: item.image,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          sellingPriceAtPurchase: item.sellingPriceAtPurchase,
          costPriceAtPurchase: item.costPriceAtPurchase,
          mrpAtPurchase: item.mrpAtPurchase,
          appliedOfferId: item.appliedOfferId ?? null,
          appliedOfferName: item.appliedOfferName ?? null,
          offerDiscountAmount: item.offerDiscountAmount ?? 0,
        })),
      });

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          provider: payload.paymentProvider,
          method: payload.paymentMethod,
          amount: payload.total,
          status: "PENDING",
        },
      });

      if (payload.couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: {
            code: payload.couponCode.toUpperCase(),
          },
        });

        if (coupon) {
          await tx.couponRedemption.create({
            data: {
              orderId: order.id,
              couponId: coupon.id,
              userId,
              codeSnapshot: coupon.code,
              discountType: coupon.discountType,
              discountValue: coupon.discountValue,
              discountAmount: payload.discount,
            },
          });

          await tx.coupon.update({
            where: {
              id: coupon.id,
            },
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
    cartId: string,
    orderItem: { variantId: string | null; quantity: number }[]
  ) {
    return prisma.$transaction(async (tx) => {
      for (const item of orderItem) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: {
              id: item.variantId,
            },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      await tx.cartItem.deleteMany({
        where: {
          cartId: cartId,
        },
      });
    });
  }

  async updateOrder(orderId: string, data: Prisma.OrderUpdateInput) {
    return prisma.order.update({
      where: {
        id: orderId,
      },
      data,
    });
  }

  async cancelOrder(
    orderId: string,
    needsStockRelease: boolean,
    orderItems: { variantId: string | null; quantity: number }[]
  ) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      });

      if (needsStockRelease) {
        for (const item of orderItems) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          }
        }
      }

      return order;
    });
  }
}

export const orderRepository = new OrderReposity();
