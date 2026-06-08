import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { DiscountType } from "../../generated/prisma/enums.js";
import type { TCreateCouponDTO, TUpdateCouponDTO } from "./coupon.schema.js";

class CouponRepository {
  async getCoupons(page: number, limit: number) {
    const [items, total] = await prisma.$transaction([
      prisma.coupon.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.coupon.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findCouponById(id: string) {
    return prisma.coupon.findUnique({
      where: {
        id,
      },
    });
  }

  async findCouponByCode(code: string) {
    return prisma.coupon.findUnique({
      where: {
        code: code.toUpperCase(),
      },
    });
  }

  async checkUserCouponRedemptions(couponId: string, userId: string): Promise<number> {
    return prisma.couponRedemption.count({
      where: {
        couponId,
        userId,
      },
    });
  }

  async createCoupon(payload: TCreateCouponDTO) {
    return prisma.coupon.create({
      data: {
        code: payload.code.toUpperCase(),
        name: payload.name,
        description: payload.description || null,
        discountType: payload.discountType,
        discountValue: payload.discountValue,
        minOrderAmount: payload.minOrderAmount ?? null,
        maxDiscountAmount: payload.maxDiscountAmount ?? null,
        startsAt: payload.startsAt,
        endsAt: payload.endsAt ?? null,
        perUserLimit: payload.perUserLimit ?? null,
        usageLimit: payload.usageLimit ?? null,
        isActive: payload.isActive,
      },
    });
  }

  async updateCoupon(couponId: string, payload: TUpdateCouponDTO) {
    const data: Prisma.CouponUpdateInput = {};
    if (payload.code !== undefined) data.code = payload.code.toUpperCase();
    if (payload.name !== undefined) data.name = payload.name;
    if (payload.description !== undefined) data.description = payload.description;
    if (payload.discountType !== undefined) data.discountType = payload.discountType;
    if (payload.discountValue !== undefined) data.discountValue = payload.discountValue;
    if (payload.minOrderAmount !== undefined) data.minOrderAmount = payload.minOrderAmount;
    if (payload.maxDiscountAmount !== undefined) data.maxDiscountAmount = payload.maxDiscountAmount;
    if (payload.startsAt !== undefined) data.startsAt = payload.startsAt;
    if (payload.endsAt !== undefined) data.endsAt = payload.endsAt;
    if (payload.perUserLimit !== undefined) data.perUserLimit = payload.perUserLimit;
    if (payload.usageLimit !== undefined) data.usageLimit = payload.usageLimit;
    if (payload.isActive !== undefined) data.isActive = payload.isActive;

    return prisma.coupon.update({
      where: {
        id: couponId,
      },
      data,
    });
  }

  async updateStatus(couponId: string, isActive: boolean) {
    return prisma.coupon.update({
      where: {
        id: couponId,
      },
      data: {
        isActive,
      },
    });
  }

  async deleteCoupon(couponId: string) {
    return prisma.coupon.delete({
      where: {
        id: couponId,
      },
    });
  }

  async createRedemption(
    tx: Prisma.TransactionClient | undefined | null,
    payload: {
      couponId: string;
      userId: string;
      orderId: string;
      codeSnapshot: string;
      discountType: DiscountType;
      discountValue: number;
      discountAmount: number;
    }
  ) {
    const db = tx || prisma;
    return db.couponRedemption.create({
      data: payload,
    });
  }

  async incrementRedeemedCount(tx: Prisma.TransactionClient | undefined | null, couponId: string) {
    const db = tx || prisma;
    return db.coupon.update({
      where: {
        id: couponId,
      },
      data: {
        redeemedCount: {
          increment: 1,
        },
      },
    });
  }

  async getRedemptions(page: number, limit: number) {
    const [items, total] = await prisma.$transaction([
      prisma.couponRedemption.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          coupon: {
            select: {
              code: true,
              name: true,
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          order: {
            select: {
              orderNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.couponRedemption.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findRedemptionById(userId: string) {
    return prisma.couponRedemption.findMany({
      where: {
        userId,
      },
    });
  }
}

export const couponRepository = new CouponRepository();
