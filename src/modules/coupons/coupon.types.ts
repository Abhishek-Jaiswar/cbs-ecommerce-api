import type { DiscountType } from "../../generated/prisma/enums.js";

export type TCouponDTO = {
  code: string;
  name: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number | undefined | null;
  maxDiscountAmount: number | undefined | null;
  usageLimit: number | undefined | null;
  perUserLimit: number | undefined | null;
  redeemedCount: number;
  startsAt: Date;
  endsAt: Date | null;
  isActive: boolean;
};
