import z from "zod";
import { DiscountType } from "../../generated/prisma/enums.js";

export const createOfferSchema = z.object({
  name: z.string().min(1, { message: "Offer name is required" }),
  slug: z
    .string()
    .min(1, { message: "Offer slug is required" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug must contain only lowercase letters, numbers, and hyphens",
    }),
  description: z.string().optional().nullable(),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.coerce.number().min(1, { message: "Discount value must be at least 1" }),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional().nullable(),
  isActive: z.boolean().default(true),
  priority: z.coerce.number().int().min(0).default(0),
  productIds: z.array(z.string().cuid()).optional().default([]),
  categoryIds: z.array(z.string().cuid()).optional().default([]),
});

export const updateOfferSchema = createOfferSchema.partial();

export const toggleOfferStatusSchema = z.object({
  isActive: z.boolean(),
});

export type TCreateOfferDTO = z.infer<typeof createOfferSchema>;
export type TUpdateOfferDTO = z.infer<typeof updateOfferSchema>;
