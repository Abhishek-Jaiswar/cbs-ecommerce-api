import type { NextFunction, Request, Response } from "express";
import { orderService } from "./order.service.js";

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
}

export const orderController = new OrderController();
