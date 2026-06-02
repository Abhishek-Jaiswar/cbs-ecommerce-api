import { z } from "zod";

export const createCategoryBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(100, "Category name cannot exceed 100 characters"),

  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .max(100, "Slug cannot exceed 100 characters"),

  excerpt: z.string().trim().max(255, "Excerpt cannot exceed 255 characters").optional(),

  parentId: z.string().cuid("Invalid parent category ID structure").optional().nullable(),

  isActive: z
    .preprocess((val) => {
      if (typeof val === "string") {
        if (val.toLowerCase() === "true") return true;
        if (val.toLowerCase() === "false") return false;
      }
      return val;
    }, z.boolean())
    .default(true),

  altText: z.string().trim().max(255, "Alt text cannot exceed 255 characters").optional(),
});

export const updateCategoryBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name must be at least 1 character")
    .max(100, "Category name cannot exceed 100 characters")
    .optional(),

  slug: z
    .string()
    .trim()
    .min(1, "Slug must be at least 1 character")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .max(100, "Slug cannot exceed 100 characters")
    .optional(),

  excerpt: z.string().trim().max(255, "Excerpt cannot exceed 255 characters").optional().nullable(),

  parentId: z.string().cuid("Invalid parent category ID structure").optional().nullable(),

  isActive: z
    .preprocess((val) => {
      if (typeof val === "string") {
        if (val.toLowerCase() === "true") return true;
        if (val.toLowerCase() === "false") return false;
      }
      return val;
    }, z.boolean())
    .optional(),

  altText: z.string().trim().max(255, "Alt text cannot exceed 255 characters").optional(),
});

export type TCreateCategoryInput = z.infer<typeof createCategoryBodySchema>;
export type TUpdateCategoryInput = z.infer<typeof updateCategoryBodySchema>;
