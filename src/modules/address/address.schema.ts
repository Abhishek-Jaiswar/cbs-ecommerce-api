import { z } from "zod";

export const createAddressBodySchema = z.object({
  fullname: z
    .string()
    .trim()
    .min(1, "Full name must be at least 1 character")
    .max(100, "Full name cannot exceed 100 characters"),

  phoneNumber: z
    .string()
    .trim()
    .min(5, "Phone number must be at least 5 characters")
    .max(20, "Phone number cannot exceed 20 characters"),

  addressLine1: z
    .string()
    .trim()
    .min(1, "Address Line 1 must be at least 1 character")
    .max(255, "Address Line 1 cannot exceed 255 characters"),

  addressLine2: z
    .string()
    .trim()
    .max(255, "Address Line 2 cannot exceed 255 characters")
    .optional()
    .nullable(),

  landmark: z
    .string()
    .trim()
    .max(255, "Landmark cannot exceed 255 characters")
    .optional()
    .nullable(),

  city: z
    .string()
    .trim()
    .min(1, "City must be at least 1 character")
    .max(100, "City cannot exceed 100 characters"),

  state: z
    .string()
    .trim()
    .min(1, "State must be at least 1 character")
    .max(100, "State cannot exceed 100 characters"),

  postalCode: z
    .string()
    .trim()
    .min(1, "Postal code must be at least 1 character")
    .max(20, "Postal code cannot exceed 20 characters"),

  country: z
    .string()
    .trim()
    .min(1, "Country must be at least 1 character")
    .max(100, "Country cannot exceed 100 characters"),

  isDefaultShipping: z.boolean().default(false),
  isDefaultBilling: z.boolean().default(false),
});

export const updateAddressBodySchema = z.object({
  fullname: z
    .string()
    .trim()
    .min(1, "Full name must be at least 1 character")
    .max(100, "Full name cannot exceed 100 characters")
    .optional(),

  phoneNumber: z
    .string()
    .trim()
    .min(5, "Phone number must be at least 5 characters")
    .max(20, "Phone number cannot exceed 20 characters")
    .optional(),

  addressLine1: z
    .string()
    .trim()
    .min(1, "Address Line 1 must be at least 1 character")
    .max(255, "Address Line 1 cannot exceed 255 characters")
    .optional(),

  addressLine2: z
    .string()
    .trim()
    .max(255, "Address Line 2 cannot exceed 255 characters")
    .optional()
    .nullable(),

  landmark: z
    .string()
    .trim()
    .max(255, "Landmark cannot exceed 255 characters")
    .optional()
    .nullable(),

  city: z
    .string()
    .trim()
    .min(1, "City must be at least 1 character")
    .max(100, "City cannot exceed 100 characters")
    .optional(),

  state: z
    .string()
    .trim()
    .min(1, "State must be at least 1 character")
    .max(100, "State cannot exceed 100 characters")
    .optional(),

  postalCode: z
    .string()
    .trim()
    .min(1, "Postal code must be at least 1 character")
    .max(20, "Postal code cannot exceed 20 characters")
    .optional(),

  country: z
    .string()
    .trim()
    .min(1, "Country must be at least 1 character")
    .max(100, "Country cannot exceed 100 characters")
    .optional(),

  isDefaultShipping: z.boolean().optional(),
  isDefaultBilling: z.boolean().optional(),
});

export type TCreateAddressInput = z.infer<typeof createAddressBodySchema>;
export type TUpdateAddressInput = z.infer<typeof updateAddressBodySchema>;
