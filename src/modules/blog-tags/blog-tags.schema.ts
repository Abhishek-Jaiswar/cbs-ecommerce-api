import { z } from "zod";

export const createBlogTagBodySchema = z.object({
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

  isActive: z.boolean().default(true),
});

export const updateBlogTagBodySchema = z.object({
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

  isActive: z.boolean().optional(),
});

export type TCreateBlogTagInput = z.infer<typeof createBlogTagBodySchema>;
export type TUpdateBlogTagInput = z.infer<typeof updateBlogTagBodySchema>;
