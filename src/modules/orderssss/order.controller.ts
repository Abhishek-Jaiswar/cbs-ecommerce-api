import type { NextFunction, Request, Response } from "express";
import { orderService } from "./order.service.js";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  verifyPaymentSchema,
} from "./order.schema.js";
import { BadRequestError, UnauthorizedError } from "../../utils/errors/app-error.js";
import type { OrderStatus } from "../../generated/prisma/enums.js";
import type { TPlaceOrderInput } from "./order.types.js";

export class OrderController {
  /**
   * Place an order (COD or initialize Razorpay payment)
   */
  async placeOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication required");
      }

      // Validate the request body using Zod schema
      const validation = createOrderSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.issues.map((issue) => issue.message),
        });
      }

      const { shippingAddress, addressId, paymentMethod, paymentProvider, couponCode } = validation.data;

      const placeOrderInput: TPlaceOrderInput = {
        paymentMethod,
        paymentProvider,
        couponCode: couponCode ?? null,
      };

      if (addressId !== undefined) {
        placeOrderInput.addressId = addressId;
      }

      if (shippingAddress) {
        const { addressLine2, landmark, isDefaultShipping, isDefaultBilling, ...rest } = shippingAddress;

        placeOrderInput.shippingAddress = {
          ...rest,
          addressLine2: addressLine2 ?? null,
          landmark: landmark ?? null,
        };

        if (isDefaultShipping !== undefined) {
          placeOrderInput.shippingAddress.isDefaultShipping = isDefaultShipping;
        }
        if (isDefaultBilling !== undefined) {
          placeOrderInput.shippingAddress.isDefaultBilling = isDefaultBilling;
        }
      }

      // Delegate order placement logic to OrderService
      const result = await orderService.placeOrder(userId, placeOrderInput);

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify Razorpay payment signature
   */
  async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body containing payment details and signature
      const validation = verifyPaymentSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.issues.map((issue) => issue.message),
        });
      }

      // Delegate verification and order processing to OrderService
      const order = await orderService.verifyPayment(validation.data);

      return res.status(200).json({
        success: true,
        message: "Payment verified & order processed successfully",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve list of all orders (Admin only)
   */
  async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const result = await orderService.getOrders(page, limit);

      return res.status(200).json({
        success: true,
        message: "All orders fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get details of a single order by ID
   */
  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.orderId as string;
      const userId = req.user?.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication required");
      }

      if (!orderId) {
        throw new BadRequestError("Order ID is required");
      }

      const order = await orderService.getOrderById(orderId);

      // Users can only view their own orders; admins can view any order
      if (req.user?.role !== "ADMIN" && order.userId !== userId) {
        throw new UnauthorizedError("You are not authorized to view this order");
      }

      return res.status(200).json({
        success: true,
        message: "Order fetched successfully",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all orders for the authenticated user
   */
  async getUserOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication required");
      }

      const orders = await orderService.getUserOrders(userId);

      return res.status(200).json({
        success: true,
        message: "Orders fetched successfully",
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update the status of an order (Admin only)
   */
  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.orderId as string;

      if (!orderId) {
        throw new BadRequestError("Order ID is required");
      }

      const validation = updateOrderStatusSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.issues.map((issue) => issue.message),
        });
      }

      const updatePayload: { status: OrderStatus; trackingNumber?: string } = {
        status: validation.data.status,
      };

      if (validation.data.trackingNumber !== undefined) {
        updatePayload.trackingNumber = validation.data.trackingNumber;
      }

      const updatedOrder = await orderService.updateOrderStatus(orderId, updatePayload);

      return res.status(200).json({
        success: true,
        message: "Order status updated successfully",
        data: updatedOrder,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const orderController = new OrderController();
