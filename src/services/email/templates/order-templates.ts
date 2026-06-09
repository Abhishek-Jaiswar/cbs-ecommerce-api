function formatPrice(price: number | string) {
  const numeric = Number(price);
  if (isNaN(numeric)) return String(price);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(numeric);
}

const emailLayout = (title: string, content: string) => `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #222222; background-color: #ffffff; line-height: 1.6;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="font-size: 26px; font-weight: 300; letter-spacing: 6px; text-transform: uppercase; margin: 0; color: #111111;">ZENVORAA</h1>
    <p style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #999999; margin: 6px 0 0 0;">Fine Jewelry</p>
  </div>
  <hr style="border: none; border-top: 1px solid #eaeaea; margin-bottom: 30px;" />
  
  <div style="margin-bottom: 40px;">
    ${content}
  </div>

  <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
  
  <div style="text-align: center; font-size: 11px; color: #999999; letter-spacing: 1px;">
    <p style="margin: 0 0 10px 0;">This is an automated notification regarding your Zenvoraa account/order.</p>
    <p style="margin: 0;">&copy; ${new Date().getFullYear()} Zenvoraa India. All Rights Reserved.</p>
  </div>
</div>
`;

export const orderCreatedTemplate = (order: any, userName: string, isAdmin: boolean) => {
  const greeting = isAdmin
    ? `<h3>New Order Received</h3><p>Hello Admin,</p><p>A new order has been placed by <strong>${userName}</strong> (${order.user?.email || "N/A"}).</p>`
    : `<h3>Thank you for your order</h3><p>Hello ${userName},</p><p>We are pleased to confirm your order has been received and is now being processed.</p>`;

  const itemsHtml = order.orderItems
    .map(
      (item: any) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #f2f2f2; font-size: 14px;">
        <div><strong>${item.name}</strong></div>
        ${item.sku ? `<div style="font-size: 11px; color: #888888; margin-top: 2px;">SKU: ${item.sku}</div>` : ""}
        <div style="font-size: 12px; color: #666666; margin-top: 4px;">Qty: ${item.quantity} &times; ${formatPrice(item.unitPrice)}</div>
      </td>
      <td style="padding: 12px 0; text-align: right; border-bottom: 1px solid #f2f2f2; font-size: 14px; font-weight: 500; vertical-align: top;">
        ${formatPrice(item.totalPrice)}
      </td>
    </tr>
  `
    )
    .join("");

  const content = `
    ${greeting}
    
    <div style="background-color: #fcfbfa; border: 1px solid #f3ebe0; padding: 20px; margin: 25px 0; font-size: 14px;">
      <div style="margin-bottom: 8px;"><strong>Order Number:</strong> ${order.orderNumber}</div>
      <div style="margin-bottom: 8px;"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</div>
      <div style="margin-bottom: 8px;"><strong>Status:</strong> ${order.status}</div>
      <div><strong>Payment Status:</strong> ${order.paymentStatus} (${order.payments?.[0]?.provider || "COD"})</div>
    </div>

    <h4 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #111111; padding-bottom: 8px; margin-top: 30px; margin-bottom: 15px;">Order Details</h4>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr>
          <th style="text-align: left; font-size: 12px; text-transform: uppercase; color: #888888; padding-bottom: 10px; border-bottom: 1px solid #eaeaea;">Item</th>
          <th style="text-align: right; font-size: 12px; text-transform: uppercase; color: #888888; padding-bottom: 10px; border-bottom: 1px solid #eaeaea;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 30px;">
      <tr>
        <td style="padding: 6px 0; color: #666666;">Subtotal</td>
        <td style="padding: 6px 0; text-align: right;">${formatPrice(order.subtotalAmount)}</td>
      </tr>
      ${
        Number(order.discountAmount) > 0
          ? `
      <tr>
        <td style="padding: 6px 0; color: #666666;">Discount</td>
        <td style="padding: 6px 0; text-align: right; color: #b91c1c;">-${formatPrice(order.discountAmount)}</td>
      </tr>
      `
          : ""
      }
      <tr>
        <td style="padding: 6px 0; color: #666666;">Shipping</td>
        <td style="padding: 6px 0; text-align: right;">${Number(order.shippingAmount) === 0 ? "Free" : formatPrice(order.shippingAmount)}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #666666;">Tax</td>
        <td style="padding: 6px 0; text-align: right;">${formatPrice(order.taxAmount)}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0 0 0; border-top: 1px solid #eaeaea; font-size: 16px; font-weight: bold;">Total</td>
        <td style="padding: 12px 0 0 0; border-top: 1px solid #eaeaea; text-align: right; font-size: 16px; font-weight: bold; color: #c29958;">${formatPrice(order.totalAmount)}</td>
      </tr>
    </table>

    <h4 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #111111; padding-bottom: 8px; margin-bottom: 15px;">Shipping Address</h4>
    <p style="font-size: 14px; color: #555555; margin: 0; line-height: 1.6;">
      <strong>${order.fullname}</strong><br />
      ${order.addressLine1}<br />
      ${order.addressLine2 ? `${order.addressLine2}<br />` : ""}
      ${order.landmark ? `Landmark: ${order.landmark}<br />` : ""}
      ${order.city}, ${order.state} - ${order.postalCode}<br />
      ${order.country}<br />
      Phone: ${order.phoneNumber}
    </p>
  `;

  return emailLayout(isAdmin ? "New Order" : "Order Confirmed", content);
};

export const orderCancelledTemplate = (order: any, userName: string, isAdmin: boolean) => {
  const greeting = isAdmin
    ? `<h3>Order Cancelled Notice</h3><p>Hello Admin,</p><p>Order <strong>${order.orderNumber}</strong> has been cancelled by the customer or management.</p>`
    : `<h3>Your order has been cancelled</h3><p>Hello ${userName},</p><p>We are writing to confirm that your order <strong>${order.orderNumber}</strong> has been cancelled.</p>`;

  const content = `
    ${greeting}
    
    <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 20px; margin: 25px 0; font-size: 14px; color: #991b1b;">
      <div style="margin-bottom: 8px;"><strong>Order Number:</strong> ${order.orderNumber}</div>
      <div style="margin-bottom: 8px;"><strong>Cancelled Date:</strong> ${new Date().toLocaleDateString()}</div>
      <div><strong>Refund Status:</strong> If any amount was debited, it will be refunded back to the original payment method within 5-7 business days.</div>
    </div>

    <p style="font-size: 14px; color: #555555;">
      Summary of cancelled order:
    </p>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 6px 0; color: #666666;">Total Amount Cancelled:</td>
        <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #b91c1c;">${formatPrice(order.totalAmount)}</td>
      </tr>
    </table>
    
    <p style="font-size: 14px; color: #555555; margin-top: 30px;">
      If you did not request this cancellation or have any questions, please reply to this email or contact our support team.
    </p>
  `;

  return emailLayout("Order Cancelled", content);
};

export const orderDeliveredTemplate = (order: any, userName: string, isAdmin: boolean) => {
  const greeting = isAdmin
    ? `<h3>Order Delivered Notice</h3><p>Hello Admin,</p><p>Order <strong>${order.orderNumber}</strong> has been successfully delivered to the customer.</p>`
    : `<h3>Your order has been delivered!</h3><p>Hello ${userName},</p><p>Great news! Your order <strong>${order.orderNumber}</strong> has been delivered. We hope you love your new jewelry!</p>`;

  const content = `
    ${greeting}
    
    <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; padding: 20px; margin: 25px 0; font-size: 14px; color: #166534;">
      <div style="margin-bottom: 8px;"><strong>Order Number:</strong> ${order.orderNumber}</div>
      <div style="margin-bottom: 8px;"><strong>Delivered Date:</strong> ${new Date().toLocaleDateString()}</div>
      <div><strong>Status:</strong> Delivered</div>
    </div>

    <h4 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #111111; padding-bottom: 8px; margin-bottom: 15px;">Delivery Details</h4>
    <p style="font-size: 14px; color: #555555; margin: 0; line-height: 1.6;">
      <strong>Recipient:</strong> ${order.fullname}<br />
      <strong>Delivered to:</strong> ${order.addressLine1}, ${order.city}, ${order.state} - ${order.postalCode}<br />
      <strong>Phone:</strong> ${order.phoneNumber}
    </p>

    <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
      <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/account" style="background-color: #c29958; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; display: inline-block;">
        View Your Order
      </a>
    </div>
  `;

  return emailLayout("Order Delivered", content);
};
