import z from "zod";
import { DiscountType } from "../../generated/prisma/enums.js";

export const createCouponSchema = z.object({
  code: z
    .string()
    .min(3, { message: "Coupon code must be at least 3 characters" })
    .max(16, { message: "Coupon code must be at most 16 characters" })
    .regex(/^[A-Z0-9_-]+$/, {
      message: "Coupon code must contain only uppercase letters, numbers, hyphens, and underscores",
    }),
  name: z.string().min(1, { message: "Coupon name is required" }),
  description: z.string().optional(),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.coerce.number().min(1, { message: "Discount value must be at least 1" }),
  minOrderAmount: z.coerce.number().min(0).optional().nullable(),
  maxDiscountAmount: z.coerce.number().min(0).optional().nullable(),
  usageLimit: z.coerce.number().int().min(1).optional().nullable(),
  perUserLimit: z.coerce.number().int().min(1).optional().nullable(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateCouponSchema = createCouponSchema.partial();

export const validateCouponSchema = z.object({
  code: z.string().min(1, { message: "Coupon code is required" }),
  orderAmount: z.coerce.number().min(0, { message: "Order amount must be a positive number" }),
});

export const toggleCouponStatusSchema = z.object({
  isActive: z.boolean(),
});

export type TCreateCouponDTO = z.infer<typeof createCouponSchema>;
export type TUpdateCouponDTO = z.infer<typeof updateCouponSchema>;
export type TValidateCouponDTO = z.infer<typeof validateCouponSchema>;
