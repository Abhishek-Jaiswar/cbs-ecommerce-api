import { Env } from "../../config/env.config.js";
import crypto from "crypto";

export class RazorpayService {
  static async createRazorpayOrder(amount: number, receiptId: string) {
    const keyId = Env.RAZORPAY_KEY_ID;
    const keySecret = Env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error("Razorpay API key ID or Secret is not configured");
    }

    // Amount must be in paise, we'll convert it
    const payload = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: receiptId,
    };

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create Razorpay order: ${errorText}`);
    }

    return response.json();
  }

  static verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    const keySecret = Env.RAZORPAY_KEY_ID;
    const generated = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    return generated === signature;
  }
}
