import { z } from "zod";

export const createReviewBodySchema = z.object({
  rating: z.coerce
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),

  comment: z
    .string()
    .trim()
    .min(1, "Comment must be at least 1 character")
    .max(1000, "Comment cannot exceed 1000 characters"),

  productId: z.string().cuid("Invalid product ID structure"),
});

export const updateReviewBodySchema = z.object({
  rating: z.coerce
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5")
    .optional(),

  comment: z
    .string()
    .trim()
    .min(1, "Comment must be at least 1 character")
    .max(1000, "Comment cannot exceed 1000 characters")
    .optional(),
});

export type TCreateReviewInput = z.infer<typeof createReviewBodySchema>;
export type TUpdateReviewInput = z.infer<typeof updateReviewBodySchema>;
