import z from "zod";

export const BasicInfoObjectSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255),

  slug: z
    .string()
    .min(1, "Product slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),

  brandId: z.string().cuid().nullable().optional(),
  categoryId: z.string().cuid("Category is required"),
  tagIds: z.array(z.string().cuid()).default([]),

  excerpt: z.string().min(1, "Product excerpt is required"),
  description: z.string().min(1, "Product description is required"),

  price: z.coerce.number().positive("Selling price must be greater than 0"),

  originalPrice: z.coerce.number().positive("MRP must be greater than 0"),

  costPrice: z.coerce.number().nonnegative("Cost price must be greater than or equal to 0").default(0),

  offerEnds: z.coerce.date().optional(),

  isNew: z.boolean().default(false),
  isSale: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  forListing: z.boolean().default(false),
});

export const BasicInfoSchema = BasicInfoObjectSchema.refine((data) => data.price <= data.originalPrice, {
  message: "Selling price must be less than or equal to MRP",
  path: ["price"],
});

export const productColorSchema = z.object({
  name: z.string().trim().min(1, "Color name is required").max(50),

  hex: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color"),

  productId: z.string().cuid(),
});

export const productSizeSchema = z.object({
  value: z.string().trim().min(1, "Size value is required").max(20),

  productId: z.string().cuid(),
});

export const productImageUploadSchema = z.object({
  productId: z.string().cuid(),

  colorId: z.string().cuid().optional(),

  images: z
    .array(z.instanceof(File))
    .min(1, "At least one image is required")
    .max(20, "Maximum 20 images allowed"),
});

export const productVariantSchema = z.object({
  productId: z.string().cuid(),
  price: z.coerce.number().positive("Price must be greater than 0"),

  colorId: z.string().cuid(),

  sizeId: z.string().cuid(),

  stock: z.coerce.number().int().min(0),
});

export const productSpecificationSchema = z.object({
  key: z.string().trim().min(1, "Specification key is required"),
  value: z.string().trim().min(1, "Specification value is required"),
});

export type TBasicInfoDTO = z.infer<typeof BasicInfoSchema>;
export type TProductColorDTO = z.infer<typeof productColorSchema>;
export type TProductSizeDTO = z.infer<typeof productSizeSchema>;
export type TProductImageUploadDTO = z.infer<typeof productImageUploadSchema>;
export type TProductVariantDTO = z.infer<typeof productVariantSchema>;
export type TProductSpecificationDTO = z.infer<typeof productSpecificationSchema>;

export type TProductVariantWithSku = TProductVariantDTO & {
  sku: string;
};

export const productStatusSchema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]),
});

export type TProductStatusDTO = z.infer<typeof productStatusSchema>;

// import { nanoid } from "nanoid";

// const sku = `SKU-${nanoid(8).toUpperCase()}`;
