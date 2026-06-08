import { prisma } from "../../lib/prisma.js";
import type { TVerifyPayment } from "./payment.types.js";

class PaymentRepository {
  async updatePayment(paymentId: string, razorpayOrderId: string) {
    return prisma.payment.update({
      where: {
        id: paymentId,
      },
      data: {
        razorpayOrderId,
      },
    });
  }

  async updatePaymentOnFailure(
    orderId: string,
    paymentId: string,
    payload: { failureMessage: string }
  ) {
    return await prisma.$transaction([
      prisma.order.update({
        where: {
          id: orderId,
        },
        data: {
          status: "FAILED",
        },
      }),

      prisma.payment.update({
        where: {
          id: paymentId,
        },
        data: {
          status: "FAILED",
          failureMessage: payload.failureMessage,
        },
      }),
    ]);
  }

  async verifyPayment(payload: TVerifyPayment) {
    return await prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: {
          orderId: payload.orderId,
          provider: "RAZORPAY",
        },
        data: {
          status: "PAID",
          razorpayOrderId: payload.razorpayOrderId,
          razorpayPaymentId: payload.razorpayPaymentId,
          razorpaySignature: payload.razorpaySignature,
          paidAt: new Date(),
          capturedAt: new Date(),
        },
      });

      const order = await tx.order.update({
        where: {
          id: payload.orderId,
        },
        data: {
          paymentStatus: "PAID",
          status: "PROCESSING",
        },
        include: {
          orderItems: true,
        },
      });

      // Deduct Inventory Stock
      for (const item of order.orderItems) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      // Clear Customer's Cart
      const cart = await tx.cart.findUnique({
        where: { userId: order.userId },
      });
      if (cart) {
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });
      }

      return order;
    });
  }

  async findPayments(page: number, limit: number) {
    const [items, total] = await prisma.$transaction([
      prisma.payment.findMany({
        take: limit,
        skip: (page - 1) * limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              fullname: true,
            },
          },
        },
      }),
      prisma.payment.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const paymentRepository = new PaymentRepository();
