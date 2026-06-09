import type { NextFunction, Request, Response } from "express";
import { verifyPaymentSchema } from "../orders/order.schema.js";
import { RazorpayService } from "./razorpay.service.js";
import { paymentRepository } from "./payment.repository.js";
import { orderCache } from "../orders/order.cache.js";
import { orderRepository } from "../orders/order.repository.js";
import { userRepository } from "../user/user.repository.js";
import { emailService } from "../../services/email/mail.service.js";
import { Env } from "../../config/env.config.js";

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

      // Send order confirmation emails asynchronously
      (async () => {
        try {
          const orderWithDetails = await orderRepository.findOrderById(orderId);
          const user = await userRepository.findUserById(order.userId);
          if (user && orderWithDetails) {
            await emailService.sendOrderCreatedEmail(user.email, orderWithDetails, user.name, false);
            const adminEmail = Env.ADMIN_NOTIFICATION_EMAIL || Env.MAIL_USER;
            await emailService.sendOrderCreatedEmail(adminEmail, orderWithDetails, user.name, true);
          }
        } catch (err) {
          console.error("Failed to send paid order confirmation emails:", err);
        }
      })();

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
