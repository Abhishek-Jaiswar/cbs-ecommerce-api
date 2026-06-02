import { z } from "zod";

export const createProductTagBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tag name must be at least 1 character")
    .max(50, "Tag name cannot exceed 50 characters"),

  slug: z
    .string()
    .trim()
    .min(1, "Slug must be at least 1 character")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .max(50, "Slug cannot exceed 50 characters"),
});

export const updateProductTagBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tag name must be at least 1 character")
    .max(50, "Tag name cannot exceed 50 characters")
    .optional(),

  slug: z
    .string()
    .trim()
    .min(1, "Slug must be at least 1 character")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .max(50, "Slug cannot exceed 50 characters")
    .optional(),
});

export type TCreateProductTagInput = z.infer<typeof createProductTagBodySchema>;
export type TUpdateProductTagInput = z.infer<typeof updateProductTagBodySchema>;
