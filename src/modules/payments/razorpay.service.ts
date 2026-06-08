import crypto from "node:crypto";

export class RazorpayService {
  /**
   * Create an order on Razorpay
   * @param amount The order total amount in INR
   * @param receiptId The local order ID/number as a receipt reference
   * @returns Razorpay order response object
   */
  static async createRazorpayOrder(amount: number, receiptId: string) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error("Razorpay API Key ID or Secret is not configured.");
    }

    // Amount must be in paise (e.g. 500 INR = 50000 paise)
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

  /**
   * Verify Razorpay callback signature
   * @param orderId Razorpay order ID
   * @param paymentId Razorpay payment ID
   * @param signature Razorpay signature
   * @returns boolean representing if the signature is valid
   */
  static verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    const generated = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    return generated === signature;
  }
}
