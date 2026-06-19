import { z } from "zod";

// CREATE

export const createBlogCategoryBodySchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(1, {
        message:
          "Category name is required",
      })
      .max(50, {
        message:
          "Category name cannot exceed 50 characters",
      }),

    slug: z
      .string()
      .trim()
      .min(1, {
        message:
          "Category slug is required",
      })
      .regex(
        /^[a-z0-9-]+$/,
        {
          message:
            "Slug can contain only lowercase letters, numbers and hyphens",
        }
      )
      .max(50),

    isActive:
      z.boolean().default(true),
  });

// UPDATE

export const updateBlogCategoryBodySchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .optional(),

    slug: z
      .string()
      .trim()
      .regex(
        /^[a-z0-9-]+$/
      )
      .optional(),

    isActive:
      z.boolean().optional(),
  });

// TYPES

export type TCreateBlogCategoryInput =
  z.infer<
    typeof createBlogCategoryBodySchema
  >;

export type TUpdateBlogCategoryInput =
  z.infer<
    typeof updateBlogCategoryBodySchema
  >;