import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { TCartItem, TCreateOrder } from "./order.types.js";

class OrderRepository {
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
        orderItems: {
          include: {
            product: {
              select: {
                slug: true,
              },
            },
          },
        },
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
          orderItems: {
            include: {
              product: {
                select: {
                  slug: true,
                },
              },
            },
          },
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

      // Reserve stock: Increment committedQty and write InventoryTransaction
      for (const item of cartItems) {
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: { physicalQty: true, committedQty: true },
          });

          if (variant) {
            const previousAvailable = variant.physicalQty - variant.committedQty;
            const updated = await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                committedQty: {
                  increment: item.quantity,
                },
              },
            });
            const newAvailable = updated.physicalQty - updated.committedQty;

            await tx.inventoryTransaction.create({
              data: {
                variantId: item.variantId,
                type: "ORDER_RESERVED",
                qtyChange: -item.quantity,
                previousQty: previousAvailable,
                newQty: newAvailable,
                reason: `Stock reserved for order ${order.orderNumber}`,
                orderId: order.id,
              },
            });
          }
        }
      }

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
      // Stock reservation is done in createPendingOrder, so we only clear the cart here
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
    orderItems: { variantId: string | null; quantity: number }[],
    targetStatus: "CANCELLED" | "FAILED" = "CANCELLED"
  ) {
    return prisma.$transaction(async (tx) => {
      const orderBefore = await tx.order.findUnique({
        where: { id: orderId },
        select: { status: true },
      });

      if (!orderBefore) {
        throw new Error("Order not found");
      }

      if (orderBefore.status === "CANCELLED" || orderBefore.status === "FAILED") {
        return orderBefore as any;
      }

      const isAlreadyShipped = orderBefore.status === "SHIPPED" || orderBefore.status === "DELIVERED";

      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          status: targetStatus,
          ...(targetStatus === "CANCELLED" ? { cancelledAt: new Date() } : {}),
        },
      });

      for (const item of orderItems) {
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: { physicalQty: true, committedQty: true },
          });

          if (variant) {
            const previousAvailable = variant.physicalQty - variant.committedQty;
            
            let updated;
            if (isAlreadyShipped) {
              // If already shipped, physical stock was decremented and committedQty was released.
              // Restock physicalQty. Do not touch committedQty.
              updated = await tx.productVariant.update({
                where: { id: item.variantId },
                data: {
                  physicalQty: {
                    increment: item.quantity,
                  },
                },
              });
            } else {
              // If not shipped, release committedQty reservation.
              updated = await tx.productVariant.update({
                where: { id: item.variantId },
                data: {
                  committedQty: {
                    decrement: item.quantity,
                  },
                },
              });
            }
            
            const newAvailable = updated.physicalQty - updated.committedQty;

            await tx.inventoryTransaction.create({
              data: {
                variantId: item.variantId,
                type: "ORDER_CANCELLED",
                qtyChange: item.quantity,
                previousQty: previousAvailable,
                newQty: newAvailable,
                reason: isAlreadyShipped
                  ? `Stock returned & restocked from cancelled shipped/delivered order ${order.orderNumber}`
                  : `Stock reservation released from cancelled/failed order ${order.orderNumber}`,
                orderId: order.id,
              },
            });
          }
        }
      }

      return order;
    });
  }

  async shipOrder(orderId: string, updateData: Prisma.OrderUpdateInput) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          orderItems: true,
        },
      });

      for (const item of order.orderItems) {
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: { physicalQty: true, committedQty: true },
          });

          if (variant) {
            const previousAvailable = variant.physicalQty - variant.committedQty;
            const updated = await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                physicalQty: {
                  decrement: item.quantity,
                },
                committedQty: {
                  decrement: item.quantity,
                },
              },
            });
            const newAvailable = updated.physicalQty - updated.committedQty;

            await tx.inventoryTransaction.create({
              data: {
                variantId: item.variantId,
                type: "ORDER_SHIPPED",
                qtyChange: 0,
                previousQty: previousAvailable,
                newQty: newAvailable,
                reason: `Stock deducted on order shipment ${order.orderNumber}`,
                orderId: order.id,
              },
            });
          }
        }
      }

      return order;
    });
  }
}

export const orderRepository = new OrderRepository();
