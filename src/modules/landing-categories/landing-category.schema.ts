import { z } from "zod";

export const createLandingCategorySchema = z.object({
  categoryId: z.string().min(1, "Category ID is required"),
  label: z.string().trim().min(1, "Label is required").max(100, "Label cannot exceed 100 characters"),
  slot: z.preprocess((val) => {
    if (typeof val === "string") {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? val : parsed;
    }
    return val;
  }, z.number().int("Slot must be an integer").min(1, "Slot must be at least 1")),
  isActive: z
    .preprocess((val) => {
      if (typeof val === "string") {
        if (val.toLowerCase() === "true") return true;
        if (val.toLowerCase() === "false") return false;
      }
      return val;
    }, z.boolean())
    .default(true),
});

export const updateLandingCategorySchema = z.object({
  categoryId: z.string().min(1, "Category ID must be a valid string").optional(),
  label: z.string().trim().min(1, "Label must be at least 1 character").max(100, "Label cannot exceed 100 characters").optional(),
  slot: z.preprocess((val) => {
    if (typeof val === "string") {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? val : parsed;
    }
    return val;
  }, z.number().int("Slot must be an integer").min(1, "Slot must be at least 1")).optional(),
  isActive: z
    .preprocess((val) => {
      if (typeof val === "string") {
        if (val.toLowerCase() === "true") return true;
        if (val.toLowerCase() === "false") return false;
      }
      return val;
    }, z.boolean())
    .optional(),
});

export const updateLandingCategoryStatusSchema = z.object({
  isActive: z
    .preprocess((val) => {
      if (typeof val === "string") {
        if (val.toLowerCase() === "true") return true;
        if (val.toLowerCase() === "false") return false;
      }
      return val;
    }, z.boolean({ required_error: "isActive is required" })),
});

export type TCreateLandingCategoryInput = z.infer<typeof createLandingCategorySchema>;
export type TUpdateLandingCategoryInput = z.infer<typeof updateLandingCategorySchema>;
