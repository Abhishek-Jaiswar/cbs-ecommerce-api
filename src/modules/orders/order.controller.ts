import type { NextFunction, Request, Response } from "express";
import { orderService } from "./order.service.js";
import { createOrderSchema, updateOrderStatusSchema } from "./order.schema.js";
import { generatePdfFromHtml } from "../../services/pdf/pdf-generator.js";
import { invoiceTemplate } from "../../services/pdf/pdf-templates/invoice-template.js";
import { shippingLabelTemplate } from "../../services/pdf/pdf-templates/shipping-label-template.js";

class OrderController {
  async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 10), 100);

      const orders = await orderService.findOrders(page, limit);

      return res.status(200).json({
        message: "Got all orders",
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 10), 100);

      const orders = await orderService.findUserOrdersByUserId(userId, page, limit);

      return res.status(200).json({
        message: "Fetched your orders successfully",
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.id as string;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const order = await orderService.findOrderById(orderId, userId, userRole === "ADMIN");

      return res.status(200).json({
        message: "Order fetched successfully",
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async placeOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const validation = createOrderSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const result = await orderService.placeOrder(userId, validation.data);

      return res.status(201).json({
        message: "Order placed successfully",
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.id as string;
      const validation = updateOrderStatusSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const order = await orderService.updateOrderStatus(orderId, validation.data);

      return res.status(200).json({
        message: "Order status updated successfully",
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.id as string;
      const userId = req.user?.userId;
      const isAdmin = req.user?.role === "ADMIN";

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const order = await orderService.cancelOrder(orderId, userId, isAdmin);

      return res.status(200).json({
        message: "Order cancelled successfully",
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async downloadInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.id as string;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const order = await orderService.findOrderById(orderId, userId, userRole === "ADMIN");
      const html = invoiceTemplate(order, order.fullname || "Customer");
      const pdfBuffer = await generatePdfFromHtml(html);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=invoice-${order.orderNumber}.pdf`);
      return res.status(200).send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  async downloadShippingLabel(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.id as string;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId || userRole !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
        });
      }

      const order = await orderService.findOrderById(orderId, userId, true);
      const html = shippingLabelTemplate(order);
      const pdfBuffer = await generatePdfFromHtml(html, {
        width: "4in",
        height: "6in",
        margin: {
          top: "2mm",
          bottom: "2mm",
          left: "2mm",
          right: "2mm",
        },
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename=shipping-label-${order.orderNumber}.pdf`);
      return res.status(200).send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
}

export const orderController = new OrderController();
