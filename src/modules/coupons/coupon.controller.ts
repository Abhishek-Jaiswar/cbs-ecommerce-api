import type { Request, Response, NextFunction } from "express";
import {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
  toggleCouponStatusSchema,
} from "./coupon.schema.js";
import { couponService } from "./coupon.service.js";
import { BadRequestError, UnauthorizedError } from "../../utils/errors/app-error.js";

class CouponController {
  async getCoupons(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

      const result = await couponService.getCoupons(page, limit);

      return res.status(200).json({
        success: true,
        message: "Coupons fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCouponById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new BadRequestError("Coupon ID is required");
      }

      const coupon = await couponService.getCouponById(id);

      return res.status(200).json({
        success: true,
        message: "Coupon details fetched successfully",
        data: coupon,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = createCouponSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const coupon = await couponService.createCoupon(validation.data);

      return res.status(201).json({
        success: true,
        message: "Coupon created successfully",
        data: coupon,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new BadRequestError("Coupon ID is required");
      }

      const validation = updateCouponSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const coupon = await couponService.updateCoupon(id, validation.data);

      return res.status(200).json({
        success: true,
        message: "Coupon updated successfully",
        data: coupon,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new BadRequestError("Coupon ID is required");
      }

      const validation = toggleCouponStatusSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const coupon = await couponService.updateStatus(id, validation.data.isActive);

      return res.status(200).json({
        success: true,
        message: "Coupon status updated successfully",
        data: coupon,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new BadRequestError("Coupon ID is required");
      }

      await couponService.deleteCoupon(id);

      return res.status(200).json({
        success: true,
        message: "Coupon deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async validateCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication is required to validate coupons.");
      }

      const validation = validateCouponSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const result = await couponService.validateCoupon(
        validation.data.code,
        req.user.userId,
        validation.data.orderAmount
      );

      return res.status(200).json({
        success: true,
        message: "Coupon is valid",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRedemptions(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

      const result = await couponService.getRedemptions(page, limit);

      return res.status(200).json({
        success: true,
        message: "Coupon redemptions fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const couponController = new CouponController();
