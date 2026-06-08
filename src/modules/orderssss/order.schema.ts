import z from "zod";

const addressSchema = z.object({
  fullname: z.string().min(2),
  phoneNumber: z.string().min(10),
  addressLine1: z.string().min(3),
  addressLine2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  isDefaultShipping: z.boolean().default(false),
  isDefaultBilling: z.boolean().default(false),
  postalCode: z.string().length(6),
  country: z.string().min(2),
});

export const createOrderSchema = z
  .object({
    shippingAddress: addressSchema.optional(),
    addressId: z.string().optional(),
    paymentMethod: z.enum(["CARD", "UPI", "NETBANKING", "WALLET", "EMI", "COD"]),
    paymentProvider: z.enum(["RAZORPAY", "COD"]),
    couponCode: z.string().optional(),
  })
  .refine((data) => data.addressId || data.shippingAddress, {
    message: "Either addressId or shippingAddress is required",
    path: ["addressId"],
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

