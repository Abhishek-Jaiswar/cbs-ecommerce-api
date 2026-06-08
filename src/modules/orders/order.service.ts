import { BadRequestError, NotFoundError } from "../../utils/errors/app-error.js";
import { addressRepository } from "../address/address.repository.js";
import { couponRepository } from "../coupons/coupon.repository.js";
import { orderCache } from "./order.cache.js";
import { orderRepository } from "./order.repository.js";
import type { TPlaceOrderInput, TShippingAddress } from "./order.types.js";

class OrderService {
  async findOrders(page: number, limit: number) {
    return await orderCache.geOrSetOrderLists(page, limit, () =>
      orderRepository.findOrders(page, limit)
    );
  }

  async findUserOrdersByUserId(userId: string, page: number, limit: number) {
    return await orderCache.geOrSetOrderLists(page, limit, () =>
      orderRepository.findUserOrderByUserId(userId, page, limit)
    );
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
        ...payload.shippingAddress,
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

    // Check if coupon started
    if (coupon.startsAt > new Date()) {
      throw new BadRequestError("This coupon isn't started yet!");
    }

    // Check if coupon expired
    if (coupon.endsAt && coupon.endsAt > new Date()) {
      throw new BadRequestError("This coupon is expired");
    }

    // Check of coupon is active
    if (coupon.isActive) {
        throw new BadRequestError("Coupon is inactive")
    }

    // Check required minimum amount for redeem current coupon
    if (coupon.minOrderAmount !== null && payload.subTotal < Number(coupon.minOrderAmount)) {
        throw new BadRequestError("Not eligible for this coupon, try increasing the order amount")
    }

    
  }
}

export const orderService = new OrderService();
