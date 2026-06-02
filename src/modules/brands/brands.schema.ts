import { z } from "zod";

export const createBrandBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Brand name is required")
    .max(100, "Brand name cannot exceed 100 characters"),
  altText: z.string().trim().max(255, "Alt text cannot exceed 255 characters").optional(),
});

export const updateBrandBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Brand name must be at least 1 character")
    .max(100, "Brand name cannot exceed 100 characters")
    .optional(),
  altText: z.string().trim().max(255, "Alt text cannot exceed 255 characters").optional(),
});

export type TCreateBrandInput = z.infer<typeof createBrandBodySchema>;
export type TUpdateBrandInput = z.infer<typeof updateBrandBodySchema>;
