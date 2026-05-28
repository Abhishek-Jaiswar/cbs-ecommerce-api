import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required" }),
  email: z.string().trim().email({ error: "Valid email is required" }),
  password: z.string().trim().min(8, { error: "Password is required" }),
});

export const loginSchema = z.object({
  password: z.string().trim().min(8, { error: "Password is required" }),
  email: z.string().trim().email({ error: "Valid email is required" }),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, { error: "Old password is required." }),
  newPassword: z.string().min(8, { error: "New password must be at least 8 characters." }),
});

export const validateForgetPasswordSchema = z.object({
  email: z.string().trim().email({ error: "Valid email is required" }),
});

export const validateNewPassword = z.object({
  email: z.string().trim().email({ error: "Valid email is required" }),
  newPassword: z.string().min(8, { error: "New password must be at least 8 characters." }),
});

export const OtpSchema = z.object({
  email: z.string().trim().email({ error: "Valid email is required" }),
  otp: z.string().trim().regex(/^\d{6}$/, { error: "OTP must be 6 digits" }),
});
