import type { NextFunction, Request, Response } from "express";
import { verifyPaymentSchema } from "../orders/order.schema.js";
import { RazorpayService } from "./razorpay.service.js";
import { paymentRepository } from "./payment.repository.js";
import { orderCache } from "../orders/order.cache.js";

class PaymentController {
  async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = verifyPaymentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = validation.data;

      const isValid = RazorpayService.verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment signature",
        });
      }

      const order = await paymentRepository.verifyPayment({
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      await orderCache.invalidateOrders(orderId);

      return res.status(200).json({
        success: true,
        message: "Payment verified & order processed",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 10), 100);

      const payments = await paymentRepository.findPayments(page, limit);

      return res.status(200).json({
        message: "Fetched payments audit logs successfully",
        success: true,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
