import { couponRepository } from "./coupon.repository.js";
import { ConflictError, NotFoundError, BadRequestError } from "../../utils/errors/app-error.js";
import type { TCreateCouponDTO, TUpdateCouponDTO } from "./coupon.schema.js";

class CouponService {
  async getCoupons(page: number, limit: number) {
    return couponRepository.getCoupons(page, limit);
  }

  async getCouponById(id: string) {
    const coupon = await couponRepository.findCouponById(id);
    if (!coupon) {
      throw new NotFoundError("Coupon not found.");
    }
    return coupon;
  }

  async createCoupon(payload: TCreateCouponDTO) {
    const existing = await couponRepository.findCouponByCode(payload.code);
    if (existing) {
      throw new ConflictError("Coupon code already exists.");
    }

    if (payload.endsAt && payload.endsAt < payload.startsAt) {
      throw new BadRequestError("End date must be after start date.");
    }

    return couponRepository.createCoupon(payload);
  }

  async updateCoupon(couponId: string, payload: TUpdateCouponDTO) {
    const coupon = await this.getCouponById(couponId);

    if (payload.code && payload.code.toUpperCase() !== coupon.code) {
      const existing = await couponRepository.findCouponByCode(payload.code);
      if (existing) {
        throw new ConflictError("Coupon code already exists.");
      }
    }

    const startsAt = payload.startsAt || coupon.startsAt;
    const endsAt = payload.endsAt !== undefined ? payload.endsAt : coupon.endsAt;
    if (endsAt && endsAt < startsAt) {
      throw new BadRequestError("End date must be after start date.");
    }

    return couponRepository.updateCoupon(couponId, payload);
  }

  async updateStatus(couponId: string, isActive: boolean) {
    await this.getCouponById(couponId);
    return couponRepository.updateStatus(couponId, isActive);
  }

  async deleteCoupon(couponId: string) {
    await this.getCouponById(couponId);
    await couponRepository.deleteCoupon(couponId);
    return { success: true };
  }

  async validateCoupon(code: string, userId: string, orderAmount: number) {
    const coupon = await couponRepository.findCouponByCode(code);
    if (!coupon) {
      throw new NotFoundError("Coupon code not found.");
    }

    if (!coupon.isActive) {
      throw new BadRequestError("Coupon is currently inactive.");
    }

    const now = new Date();
    if (coupon.startsAt > now) {
      throw new BadRequestError("Coupon has not started yet.");
    }

    if (coupon.endsAt && coupon.endsAt < now) {
      throw new BadRequestError("Coupon has expired.");
    }

    if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
      throw new BadRequestError(
        `Minimum order amount of ₹${coupon.minOrderAmount} is required to use this coupon.`
      );
    }

    if (coupon.usageLimit && coupon.redeemedCount >= coupon.usageLimit) {
      throw new BadRequestError("Coupon usage limit has been reached.");
    }

    if (coupon.perUserLimit && userId) {
      const userRedemptionsCount = await couponRepository.checkUserCouponRedemptions(
        coupon.id,
        userId
      );
      if (userRedemptionsCount >= coupon.perUserLimit) {
        throw new BadRequestError("You have reached your redemption limit for this coupon.");
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    const discountValue = Number(coupon.discountValue);

    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (orderAmount * discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
      }
    } else if (coupon.discountType === "FIXED_AMOUNT") {
      discountAmount = discountValue;
    }

    // Discount cannot exceed order amount
    discountAmount = Math.min(discountAmount, orderAmount);

    return {
      couponId: coupon.id,
      code: coupon.code,
      name: coupon.name,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: Number(discountAmount.toFixed(2)),
    };
  }

  async getRedemptions(page: number, limit: number) {
    return couponRepository.getRedemptions(page, limit);
  }
}

export const couponService = new CouponService();
