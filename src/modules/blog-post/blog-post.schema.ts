import { z } from "zod";

export const createBlogPostBodySchema =
  z.object({
    title: z
      .string()
      .trim()
      .min(
        3,
        "Title must be at least 3 characters"
      )
      .max(
        200,
        "Title cannot exceed 200 characters"
      ),

    slug: z
      .string()
      .trim()
      .regex(
        /^[a-z0-9-]+$/,
        "Slug must contain lowercase letters, numbers and hyphens"
      )
      .max(
        250,
        "Slug cannot exceed 250 characters"
      ),

    excerpt: z
      .string()
      .trim()
      .max(
        500,
        "Excerpt cannot exceed 500 characters"
      )
      .optional(),

    content: z
      .string()
      .trim()
      .min(
        10,
        "Content must be at least 10 characters"
      ),

    image: z
      .string()
      .url(
        "Image must be a valid URL"
      ),

    storageKey: z
      .string()
      .trim()
      .min(
        1,
        "Storage key required"
      ),

    altText: z
      .string()
      .trim()
      .min(
        3,
        "Alt text required"
      )
      .max(200),

    authorId: z
      .string()
      .trim()
      .min(
        1,
        "Author ID required"
      ),

    categoryId: z
      .string()
      .trim()
      .min(
        1,
        "Category ID required"
      ),

    tagIds: z
      .array(
        z.string()
      )
      .default([]),

    status: z
      .enum([
        "DRAFT",
        "PUBLISHED",
      ])
      .default(
        "DRAFT"
      ),

    isFeatured:
      z.boolean()
       .default(
         false
       ),

    publishedAt:
      z.coerce
       .date()
       .optional(),
  });





export const updateBlogPostBodySchema =
  z.object({
    title: z
      .string()
      .trim()
      .min(3)
      .max(200)
      .optional(),

    slug: z
      .string()
      .trim()
      .regex(
        /^[a-z0-9-]+$/
      )
      .optional(),

    excerpt: z
      .string()
      .trim()
      .max(500)
      .optional(),

    content: z
      .string()
      .trim()
      .optional(),

    image: z
      .string()
      .url()
      .optional(),

    storageKey: z
      .string()
      .optional(),

    altText: z
      .string()
      .optional(),

    categoryId: z
      .string()
      .optional(),

    tagIds: z
      .array(
        z.string()
      )
      .optional(),

    status: z
      .enum([
        "DRAFT",
        "PUBLISHED",
      ])
      .optional(),

    isFeatured:
      z.boolean()
       .optional(),

    publishedAt:
      z.coerce
       .date()
       .optional(),
  });




// inferred types

export type TCreateBlogPostInput =
  z.infer<
    typeof createBlogPostBodySchema
  >;

export type TUpdateBlogPostInput =
  z.infer<
    typeof updateBlogPostBodySchema
  >;