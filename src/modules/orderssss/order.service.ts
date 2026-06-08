import { BadRequestError, NotFoundError } from "../../utils/errors/app-error.js";
import { addressRepository } from "../address/address.repository.js";
import { cartRepository } from "../cart/cart.repository.js";
import { couponRepository } from "../coupons/coupon.repository.js";
import { prisma } from "../../lib/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import { orderRepository } from "./order.repository.js";
import { RazorpayService } from "../payments/razorpay.service.js";
import type {
  TCreateOrderDTO,
  TShippingAddress,
  TCartItemWithDetails,
  TPlaceOrderInput,
} from "./order.types.js";
import type { OrderStatus } from "../../generated/prisma/enums.js";

class OrderService {
  /**
   * Helper method to validate an existing address ID or create a new address payload.
   * Ensures that the address belongs to the current user and returns the TShippingAddress.
   */
  private async validateOrCreateAddress(
    userId: string,
    payload: TPlaceOrderInput
  ): Promise<TShippingAddress> {
    // Scenario 1: User provided an existing Address ID
    if (payload.addressId) {
      const address = await addressRepository.getAddressById(payload.addressId);

      if (!address) {
        throw new NotFoundError("Address not found");
      }

      // Security check: ensure address belongs to the user placing the order
      if (address.userId !== userId) {
        throw new BadRequestError("Provided address does not belong to user");
      }

      return address;
    }

    // Scenario 2: User provided a new Shipping Address to save
    if (payload.shippingAddress) {
      return await addressRepository.createAddress({
        ...payload.shippingAddress,
        userId,
      });
    }

    throw new BadRequestError("Shipping address is required to place order.");
  }

  /**
   * Helper method to validate a coupon code, check expiry/limits, and calculate the discount.
   */
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

    return {
      isValidCoupon: true,
      discountAmount,
      validatedCoupon: coupon,
    };
  }

  /**
   * Places an order for the user.
   * Performs stock checks, validates address, applies coupon, creates db entries,
   * and initializes Razorpay orders if Razorpay is chosen.
   */
  async placeOrder(userId: string, payload: TPlaceOrderInput) {
    // 1. Resolve and validate the shipping address
    const address = await this.validateOrCreateAddress(userId, payload);

    // 2. Fetch the user's cart
    const cart = await cartRepository.findUserCartByUserId(userId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestError("Cart is empty!");
    }

    // 3. Stock verification check before proceeding
    for (const item of cart.items) {
      if (item.quantity > item.variant.stock) {
        throw new BadRequestError(
          `Insufficient stock for ${item.variant.product.name} (Requested: ${item.quantity}, Available: ${item.variant.stock})`
        );
      }
    }

    // 4. Calculate the subtotal from active cart items
    const subTotal = cart.items.reduce(
      (sum, item) =>
        sum +
        (item.variant.price?.toNumber() ?? item.variant.product.price.toNumber()) * item.quantity,
      0
    );

    // 5. Handle coupon validation and discount calculation if couponCode is provided
    let discount = 0;
    if (payload.couponCode) {
      const couponResult = await this.getValidCoupon(payload.couponCode, {
        subTotal,
        userId,
      });
      discount = couponResult.discountAmount;
    }

    // 6. Calculate shipping, tax, and final total
    const shippingAmount = Number(payload.shippingAmount) || 0;
    const tax = payload.tax !== undefined ? Number(payload.tax) : 0;
    const total = Math.max(0, subTotal + shippingAmount + tax - discount);

    // Set order status based on payment provider
    const status: OrderStatus = payload.paymentProvider === "COD" ? "PROCESSING" : "PENDING";

    // 7. Write to database (Create Order, OrderItems snapshot, and Payment)
    const { order, payment } = await orderRepository.createPendingOrder(
      userId,
      {
        ...payload,
        shippingAddress: address,
        subTotal: subTotal.toFixed(2),
        shippingAmount: shippingAmount.toFixed(2),
        tax,
        discount,
        total,
        status,
        paymentStatus: "PENDING",
      },
      cart.items as TCartItemWithDetails[]
    );

    // 8. Finalize based on payment provider
    if (payload.paymentProvider === "COD") {
      // Cash on Delivery: Deduct variant stock & clear cart immediately
      await orderRepository.fulfillOrderStockAndClearCart(
        userId,
        cart.id,
        cart.items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        }))
      );

      return {
        success: true,
        message: "Order placed successfully via Cash on Delivery",
        order,
        payment,
      };
    } else if (payload.paymentProvider === "RAZORPAY") {
      try {
        // Initialize Razorpay Order via its API
        const razorpayOrder = await RazorpayService.createRazorpayOrder(total, order.orderNumber);

        // Update local Payment record with the Razorpay Order ID
        const updatedPayment = await prisma.payment.update({
          where: { id: payment.id },
          data: {
            razorpayOrderId: razorpayOrder.id,
          },
        });

        return {
          success: true,
          message: "Razorpay order initialized successfully",
          order,
          payment: updatedPayment,
          razorpay: {
            id: razorpayOrder.id,
            amount: razorpayOrder.amount, // in paise
            currency: razorpayOrder.currency,
          },
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        // Fail-safe: Update local status if Razorpay API call fails
        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: { status: "FAILED" },
          }),
          prisma.payment.update({
            where: { id: payment.id },
            data: { status: "FAILED", failureMessage: errorMessage },
          }),
        ]);

        throw new BadRequestError(`Razorpay order initialization failed: ${errorMessage}`);
      }
    }

    throw new BadRequestError("Unsupported payment provider specified.");
  }

  /**
   * Verifies Razorpay payment signatures and completes order processing
   */
  async verifyPayment(payload: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    // 1. Verify Razorpay callback signature
    const isValid = RazorpayService.verifySignature(
      payload.razorpayOrderId,
      payload.razorpayPaymentId,
      payload.razorpaySignature
    );

    if (!isValid) {
      throw new BadRequestError("Invalid payment signature");
    }

    // 2. Perform database updates in a transaction
    return await prisma.$transaction(async (tx) => {
      // Update Payment status to PAID
      await tx.payment.updateMany({
        where: { orderId: payload.orderId, provider: "RAZORPAY" },
        data: {
          status: "PAID",
          razorpayOrderId: payload.razorpayOrderId,
          razorpayPaymentId: payload.razorpayPaymentId,
          razorpaySignature: payload.razorpaySignature,
          paidAt: new Date(),
          capturedAt: new Date(),
        },
      });

      // Update Order paymentStatus to PAID and status to PROCESSING
      const order = await tx.order.update({
        where: { id: payload.orderId },
        data: {
          paymentStatus: "PAID",
          status: "PROCESSING",
        },
        include: {
          orderItems: true,
        },
      });

      // Deduct inventory stock for each item in the order
      for (const item of order.orderItems) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      // Clear the user's cart
      const cart = await tx.cart.findUnique({ where: { userId: order.userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      return order;
    });
  }

  /**
   * Retrieve list of orders (paginated)
   */
  async getOrders(page: number, limit: number) {
    return await orderRepository.findOrders(page, limit);
  }

  /**
   * Retrieve a single order by ID
   */
  async getOrderById(orderId: string) {
    const order = await orderRepository.findOrderById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }
    return order;
  }

  /**
   * Retrieve all orders for a specific user
   */
  async getUserOrders(userId: string) {
    return await orderRepository.findUserOrdersByUserId(userId);
  }

  /**
   * Updates shipping or delivery status of an order
   */
  async updateOrderStatus(orderId: string, payload: { status: OrderStatus; trackingNumber?: string }) {
    const order = await orderRepository.findOrderById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
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

    return await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });
  }
}

export const orderService = new OrderService();
