import { z } from "zod";

export const createOrderSchema = z.object({
  addressId: z.string().optional(),
  shippingAddress: z
    .object({
      fullname: z.string().min(2, "Full name is required"),
      phoneNumber: z.string().min(10, "Phone number is required"),
      addressLine1: z.string().min(3, "Address line 1 is required"),
      addressLine2: z.string().optional().nullable(),
      landmark: z.string().optional().nullable(),
      city: z.string().min(2, "City is required"),
      state: z.string().min(2, "State is required"),
      postalCode: z.string().min(6, "Postal code must be 6 digits"),
      country: z.string().min(2, "Country is required"),
      isDefaultShipping: z.boolean().optional(),
      isDefaultBilling: z.boolean().optional(),
    })
    .optional(),
  paymentMethod: z.enum(["CARD", "UPI", "NETBANKING", "WALLET", "EMI", "COD"]),
  paymentProvider: z.enum(["RAZORPAY", "COD"]),
  couponCode: z.string().optional().nullable(),
  utmSource: z.string().optional().nullable(),
  utmMedium: z.string().optional().nullable(),
  utmCampaign: z.string().optional().nullable(),
  utmTerm: z.string().optional().nullable(),
  utmContent: z.string().optional().nullable(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "ON_HOLD",
    "PARTIALLY_SHIPPED",
    "RETURNED",
    "FAILED",
  ]),
  trackingNumber: z.string().optional(),
});

export const verifyPaymentSchema = z.object({
  orderId: z.string(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});
