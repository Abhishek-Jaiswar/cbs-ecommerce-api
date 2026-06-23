import type { Prisma } from "../../generated/prisma/client.js";
import type { OrderStatus } from "../../generated/prisma/enums.js";
import { RazorpayService } from "../payments/razorpay.service.js";
import { prisma } from "../../lib/prisma.js";
import { TAX } from "../../utils/constants.js";
import { BadRequestError, NotFoundError } from "../../utils/errors/app-error.js";
import { addressRepository } from "../address/address.repository.js";
import { cartRepository } from "../cart/cart.repository.js";
import { couponRepository } from "../coupons/coupon.repository.js";
import { orderCache } from "./order.cache.js";
import { orderRepository } from "./order.repository.js";
import { offerService } from "../offers/offer.service.js";
import { getProductActiveOffer, calculateDiscountedPrice } from "../offers/offer-calculation.helper.js";
import { paymentRepository } from "../payments/payment.repository.js";
import { userRepository } from "../user/user.repository.js";
import { emailService } from "../../services/email/mail.service.js";
import { Env } from "../../config/env.config.js";
import { logger } from "../../lib/winston.js";
import { generatePdfFromHtml } from "../../services/pdf/pdf-generator.js";
import { invoiceTemplate } from "../../services/pdf/pdf-templates/invoice-template.js";
import type {
  TCartItem,
  TPlaceOrderInput,
  TShippingAddress,
} from "./order.types.js";
import crypto from "crypto";

class OrderService {
  async findOrders(page: number, limit: number) {
    this.autoExpirePendingOrders().catch((err) =>
      logger.error("Async auto-expire failed in findOrders:", err)
    );

    return await orderCache.geOrSetOrderLists(page, limit, undefined, () =>
      orderRepository.findOrders(page, limit)
    );
  }

  async findUserOrdersByUserId(userId: string, page: number, limit: number) {
    this.autoExpirePendingOrders().catch((err) =>
      logger.error("Async auto-expire failed in findUserOrdersByUserId:", err)
    );

    return await orderCache.geOrSetOrderLists(page, limit, userId, () =>
      orderRepository.findUserOrderByUserId(userId, page, limit)
    );
  }

  async findOrderById(orderId: string, userId: string, isAdmin: boolean) {
    const order = await orderRepository.findOrderById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }
    if (!isAdmin && order.userId !== userId) {
      throw new BadRequestError("You do not have permission to view this order");
    }
    return order;
  }

  private async validateOrCreateAddress(
    userId: string,
    payload: TPlaceOrderInput
  ): Promise<TShippingAddress> {
    if (payload.addressId) {
      const address = await addressRepository.getAddressById(payload.addressId);

      if (!address) {
        throw new NotFoundError("Address not found.");
      }

      if (address.userId !== userId) {
        throw new BadRequestError("Provided address does not belongs to users");
      }

      return address;
    }

    if (payload.shippingAddress) {
      return await addressRepository.createAddress({
        fullname: payload.shippingAddress.fullname,
        phoneNumber: payload.shippingAddress.phoneNumber,
        addressLine1: payload.shippingAddress.addressLine1,
        addressLine2: payload.shippingAddress.addressLine2 ?? null,
        landmark: payload.shippingAddress.landmark ?? null,
        city: payload.shippingAddress.city,
        state: payload.shippingAddress.state,
        postalCode: payload.shippingAddress.postalCode,
        country: payload.shippingAddress.country,
        isDefaultShipping: payload.shippingAddress.isDefaultShipping ?? false,
        isDefaultBilling: payload.shippingAddress.isDefaultBilling ?? false,
        userId,
      });
    }

    throw new BadRequestError("Shipping address is required to place order.");
  }

  private async getValidCoupon(couponCode: string, payload: { subTotal: number; userId: string }) {
    const coupon = await couponRepository.findCouponByCode(couponCode);

    if (!coupon) {
      throw new NotFoundError("Invalid coupon code");
    }

    if (coupon.startsAt > new Date()) {
      throw new BadRequestError("This coupon isn't started yet!");
    }

    if (coupon.endsAt && coupon.endsAt < new Date()) {
      throw new BadRequestError("Coupon code is expired!");
    }

    if (!coupon.isActive) {
      throw new BadRequestError("Coupon code is inactive");
    }

    // Check minimum order amount requirement
    if (coupon.minOrderAmount !== null && payload.subTotal < Number(coupon.minOrderAmount)) {
      throw new BadRequestError("Not eligible for this coupon, try increasing the order amount");
    }

    // Check user redemption limit
    const userRedeemedCount = await couponRepository.checkUserCouponRedemptions(
      coupon.id,
      payload.userId
    );

    if (coupon.perUserLimit !== null && userRedeemedCount >= Number(coupon.perUserLimit)) {
      throw new BadRequestError("You have reached the redemption limit for this coupon");
    }

    // Calculate coupon discount based on its type (Percentage vs Fixed)
    const discountAmount =
      coupon.discountType === "PERCENTAGE"
        ? coupon.maxDiscountAmount !== null
          ? Math.min(
              (payload.subTotal * Number(coupon.discountValue)) / 100,
              Number(coupon.maxDiscountAmount)
            )
          : (payload.subTotal * Number(coupon.discountValue)) / 100
        : Math.min(payload.subTotal, Number(coupon.discountValue));

    return discountAmount;
  }
  async placeOrder(userId: string, payload: Omit<TPlaceOrderInput, "tax" | "shippingAmount">) {
    this.autoExpirePendingOrders().catch((err) =>
      logger.error("Async auto-expire failed in placeOrder:", err)
    );

    // resolve address
    const address = await this.validateOrCreateAddress(userId, payload);

    // fetch cart
    const cart = await cartRepository.findUserCartByUserId(userId);

    if (!cart || cart.items.length === 0) {
      throw new BadRequestError("Cart is empty");
    }

    // stock verification before proceeding
    for (const item of cart.items) {
      const availableQty = item.variant.physicalQty - item.variant.committedQty;
      if (item.quantity > availableQty) {
        throw new BadRequestError(
          `Insufficiant stock for ${item.variant.product.name}, (Requestd: ${item.quantity}), Available: ${availableQty}`
        );
      }
    }

    const activeOffers = await offerService.getActiveOffers();

    // calculate the subtotal and prepare the cartPayload with dynamic offers applied
    let subTotal = 0;
    const cartPayload: TCartItem[] = cart.items.map((item) => {
      const baseVariantPrice = item.variant.price
        ? (item.variant.price.toNumber ? item.variant.price.toNumber() : Number(item.variant.price))
        : (item.variant.product.price.toNumber ? item.variant.product.price.toNumber() : Number(item.variant.product.price));
      
      const mrp = item.variant.product.originalPrice
        ? (item.variant.product.originalPrice.toNumber ? item.variant.product.originalPrice.toNumber() : Number(item.variant.product.originalPrice))
        : baseVariantPrice;

      const cost = item.variant.product.costPrice
        ? (item.variant.product.costPrice.toNumber ? item.variant.product.costPrice.toNumber() : Number(item.variant.product.costPrice))
        : 0;

      const offer = getProductActiveOffer(item.variant.product, activeOffers);
      const sellingPrice = calculateDiscountedPrice(baseVariantPrice, offer);
      const offerDiscountAmount = baseVariantPrice - sellingPrice;

      subTotal += sellingPrice * item.quantity;

      return {
        productId: item.variant.productId,
        variantId: item.variantId,
        name: item.variant.product.name,
        sku: item.variant.sku ?? null,
        image: item.variant.product.images[0]?.media.url || "",
        quantity: item.quantity,
        unitPrice: sellingPrice,
        totalPrice: sellingPrice * item.quantity,
        sellingPriceAtPurchase: sellingPrice,
        costPriceAtPurchase: cost,
        mrpAtPurchase: mrp,
        appliedOfferId: offer?.id ?? null,
        appliedOfferName: offer?.name ?? null,
        offerDiscountAmount: offerDiscountAmount,
      };
    });

    // Coupon validation and discount calculation if coupon code is provided

    let discount: number = 0;
    if (payload.couponCode) {
      const couponResult = await this.getValidCoupon(payload.couponCode, {
        subTotal,
        userId,
      });

      if (!couponResult) {
        throw new Error("Failed to apply coupon");
      }

      discount = Number(couponResult);
    }

    // Calculate shipping charges, taxes, and final total

    const shippingThreshold = 2000;
    const shippingAmount = subTotal >= shippingThreshold ? 0 : 25;
    const tax = TAX || 0;

    const total = Math.max(0, subTotal + shippingAmount + tax - discount);

    // Set Order status based on payment provider
    const status = payload.paymentProvider === "COD" ? "PROCESSING" : "PENDING";

    const orderNumber = this.generateOrderNumber();
    const trackingNumber = this.generateTrackingNumber();

    const { order, payment } = await orderRepository.createPendingOrder(
      userId,
      {
        orderNumber,
        trackingNumber,
        subTotal: subTotal.toFixed(2),
        shippingAmount: shippingAmount.toFixed(2),
        tax,
        discount,
        total,
        status,
        paymentStatus: "PENDING",
        paymentMethod: payload.paymentMethod,
        paymentProvider: payload.paymentProvider,
        couponCode: payload.couponCode ?? null,
        shippingAddress: address,
        utmSource: payload.utmSource ?? null,
        utmMedium: payload.utmMedium ?? null,
        utmCampaign: payload.utmCampaign ?? null,
        utmTerm: payload.utmTerm ?? null,
        utmContent: payload.utmContent ?? null,
      },
      cartPayload as TCartItem[]
    );

    // Initiate payment based on payment providers
    if (payload.paymentProvider === "COD") {
      await orderRepository.fulfillOrderStockAndClearCart(
        cart.id,
        cart.items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        }))
      );

      await orderCache.invalidateOrderLists();

      // Send order confirmation emails asynchronously
      (async () => {
        try {
          const orderWithDetails = await orderRepository.findOrderById(order.id);
          const user = await userRepository.findUserById(userId);
          if (user && orderWithDetails) {
            const invoiceHtml = invoiceTemplate(orderWithDetails, user.name);
            const pdfBuffer = await generatePdfFromHtml(invoiceHtml);
            const attachments = [
              {
                filename: `invoice-${orderWithDetails.orderNumber}.pdf`,
                content: pdfBuffer,
              },
            ];

            await emailService.sendOrderCreatedEmail(user.email, orderWithDetails, user.name, false, attachments);
            const adminEmail = Env.ADMIN_NOTIFICATION_EMAIL || Env.MAIL_USER;
            await emailService.sendOrderCreatedEmail(adminEmail, orderWithDetails, user.name, true, attachments);
          }
        } catch (err) {
          logger.error("Failed to send COD order confirmation emails:", err);
        }
      })();

      return {
        order,
        payment,
      };
    } else if (payload.paymentProvider === "RAZORPAY") {
      try {
        const razorpayOrder = await RazorpayService.createRazorpayOrder(total, order.orderNumber);
        const updatedPayment = await paymentRepository.updatePayment(payment.id, razorpayOrder.id);
        
        await orderCache.invalidateOrderLists();

        return {
          order,
          payment: updatedPayment,
          razorpayOrder,
        };
      } catch (error) {
        throw new BadRequestError(`Razorpay order creation failed: ${(error as Error).message}`);
      }
    }

    throw new BadRequestError("Unsupported payment provider");
  }

  async autoExpirePendingOrders() {
    try {
      const expiryTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      
      const ordersToExpire = await prisma.order.findMany({
        where: {
          status: "PENDING",
          paymentStatus: "PENDING",
          createdAt: {
            lt: expiryTime,
          },
          payments: {
            some: {
              provider: "RAZORPAY",
            },
          },
        },
        include: {
          orderItems: true,
        },
      });

      if (ordersToExpire.length === 0) {
        return;
      }

      logger.info(`Found ${ordersToExpire.length} expired pending Razorpay orders. Expiring them now...`);

      for (const order of ordersToExpire) {
        try {
          await orderRepository.cancelOrder(
            order.id,
            order.orderItems.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
            })),
            "FAILED"
          );
          
          await prisma.payment.updateMany({
            where: {
              orderId: order.id,
              status: "PENDING",
            },
            data: {
              status: "FAILED",
              failureMessage: "Payment window timed out (auto-expired)",
              failedAt: new Date(),
            },
          });

          await orderCache.invalidateOrders(order.id);
          logger.info(`Auto-expired order ${order.orderNumber}`);
        } catch (err) {
          logger.error(`Failed to auto-expire order ${order.orderNumber}:`, err);
        }
      }
      
      await orderCache.invalidateOrderLists();
    } catch (error) {
      logger.error("Error in autoExpirePendingOrders:", error);
    }
  }

  async updateOrderStatus(
    orderId: string,
    payload: { status: OrderStatus; trackingNumber?: string | undefined }
  ) {
    const order = await orderRepository.findOrderById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.status === payload.status) {
      return order;
    }

    // Terminal status check
    const terminalStatuses: OrderStatus[] = ["CANCELLED", "DELIVERED", "FAILED", "RETURNED"];
    if (terminalStatuses.includes(order.status)) {
      throw new BadRequestError(`Cannot change status of a terminal order (current status: ${order.status}).`);
    }

    if (payload.status === "DELIVERED" && order.status !== "SHIPPED") {
      throw new BadRequestError("Cannot mark order as DELIVERED unless it has first been marked as SHIPPED.");
    }

    // Unpaid Razorpay shipment check
    const isRazorpay = order.payments?.some((p) => p.provider === "RAZORPAY") ?? false;
    const isPaid = order.paymentStatus === "PAID";
    if (isRazorpay && !isPaid) {
      const allowedStatusUpdates: OrderStatus[] = ["CANCELLED", "FAILED", "PENDING"];
      if (!allowedStatusUpdates.includes(payload.status)) {
        throw new BadRequestError(
          `Cannot update status of Razorpay order ${order.orderNumber} to ${payload.status} because payment is still PENDING or FAILED.`
        );
      }
    }

    const updateData: Prisma.OrderUpdateInput = {
      status: payload.status,
    };

    if (payload.trackingNumber) {
      updateData.trackingNumber = payload.trackingNumber;
    }

    // Handle status transitions and set timestamps
    if (payload.status === "SHIPPED") {
      updateData.shippedAt = new Date();
    } else if (payload.status === "DELIVERED") {
      updateData.deliveredAt = new Date();
    } else if (payload.status === "CANCELLED") {
      updateData.cancelledAt = new Date();
    }

    let updatedOrder;
    if (payload.status === "CANCELLED" || payload.status === "FAILED") {
      updatedOrder = await orderRepository.cancelOrder(
        orderId,
        order.orderItems.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        payload.status
      );
    } else if (payload.status === "SHIPPED") {
      updatedOrder = await orderRepository.shipOrder(orderId, updateData);
    } else {
      updatedOrder = await orderRepository.updateOrder(orderId, updateData);
    }
    await orderCache.invalidateOrders(orderId);

    // Send emails based on the new status
    if (payload.status === "DELIVERED" || payload.status === "CANCELLED" || payload.status === "FAILED") {
      (async () => {
        try {
          const orderWithDetails = await orderRepository.findOrderById(orderId);
          const user = await userRepository.findUserById(updatedOrder.userId);
          if (user && orderWithDetails) {
            if (payload.status === "DELIVERED") {
              await emailService.sendOrderDeliveredEmail(user.email, orderWithDetails, user.name, false);
              const adminEmail = Env.ADMIN_NOTIFICATION_EMAIL || Env.MAIL_USER;
              await emailService.sendOrderDeliveredEmail(adminEmail, orderWithDetails, user.name, true);
            } else if (payload.status === "CANCELLED") {
              await emailService.sendOrderCancelledEmail(user.email, orderWithDetails, user.name, false);
              const adminEmail = Env.ADMIN_NOTIFICATION_EMAIL || Env.MAIL_USER;
              await emailService.sendOrderCancelledEmail(adminEmail, orderWithDetails, user.name, true);
            } else if (payload.status === "FAILED") {
              await emailService.sendOrderCancelledEmail(user.email, orderWithDetails, user.name, false);
              const adminEmail = Env.ADMIN_NOTIFICATION_EMAIL || Env.MAIL_USER;
              await emailService.sendOrderCancelledEmail(adminEmail, orderWithDetails, user.name, true);
            }
          }
        } catch (err) {
          logger.error(`Failed to send order status update (${payload.status}) emails:`, err);
        }
      })();
    }

    return updatedOrder;
  }

  async cancelOrder(orderId: string, userId: string, isAdmin: boolean) {
    const order = await orderRepository.findOrderById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (!isAdmin && order.userId !== userId) {
      throw new BadRequestError("You do not have permission to cancel this order");
    }

    if (order.status === "CANCELLED") {
      throw new BadRequestError("Order is already cancelled");
    }

    if (order.status === "DELIVERED") {
      throw new BadRequestError("Delivered orders cannot be cancelled");
    }

    // Only allow users to cancel PENDING or PROCESSING orders
    if (!isAdmin && order.status !== "PENDING" && order.status !== "PROCESSING") {
      throw new BadRequestError(`Cannot cancel order in status ${order.status}`);
    }

    const updatedOrder = await orderRepository.cancelOrder(
      orderId,
      order.orderItems.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      "CANCELLED"
    );

    await orderCache.invalidateOrders(orderId);

    // Send cancellation email
    (async () => {
      try {
        const orderWithDetails = await orderRepository.findOrderById(orderId);
        const user = await userRepository.findUserById(order.userId);
        if (user && orderWithDetails) {
          await emailService.sendOrderCancelledEmail(user.email, orderWithDetails, user.name, false);
          const adminEmail = Env.ADMIN_NOTIFICATION_EMAIL || Env.MAIL_USER;
          await emailService.sendOrderCancelledEmail(adminEmail, orderWithDetails, user.name, true);
        }
      } catch (err) {
        logger.error("Failed to send order cancellation emails:", err);
      }
    })();

    return updatedOrder;
  }

  generateOrderNumber() {
    return `ZVORD-${new Date().getFullYear()}-${crypto.randomInt(100000, 999999)}`;
  }

  generateTrackingNumber() {
    return `ZV${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  }
}

export const orderService = new OrderService();
