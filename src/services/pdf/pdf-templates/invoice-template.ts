/**
 * Generates the HTML string for the customer invoice.
 */
export function invoiceTemplate(order: any, userName: string): string {
  const itemsHtml = order.orderItems
    .map((item: any) => {
      const price = parseFloat(String(item.unitPrice)).toFixed(2);
      const total = parseFloat(String(item.totalPrice)).toFixed(2);
      const details = item.sku ? `SKU: ${item.sku}` : "";
      return `
        <tr class="item-row">
          <td>
            <div class="product-name">${item.name}</div>
            <div class="product-sku">${details}</div>
          </td>
          <td class="text-center">${item.quantity}</td>
          <td class="text-right">₹${price}</td>
          <td class="text-right">₹${total}</td>
        </tr>
      `;
    })
    .join("");

  const subtotal = parseFloat(String(order.subtotalAmount)).toFixed(2);
  const discount = parseFloat(String(order.discountAmount)).toFixed(2);
  const shipping = parseFloat(String(order.shippingAmount)).toFixed(2);
  const tax = parseFloat(String(order.taxAmount)).toFixed(2);
  const total = parseFloat(String(order.totalAmount)).toFixed(2);

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Invoice - ${order.orderNumber}</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #333333;
          margin: 0;
          padding: 0;
          font-size: 13px;
          line-height: 1.6;
        }
        .invoice-container {
          max-width: 800px;
          margin: auto;
          padding: 20px;
          background-color: #ffffff;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .header-table td {
          vertical-align: top;
          border: none;
        }
        .brand-logo {
          font-size: 26px;
          font-weight: 700;
          color: #222222;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .brand-subtitle {
          font-size: 10px;
          color: #c29958;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-top: -5px;
          font-weight: bold;
        }
        .invoice-title {
          font-size: 20px;
          font-weight: 700;
          color: #222222;
          text-align: right;
          text-transform: uppercase;
        }
        .invoice-meta {
          text-align: right;
          font-size: 12px;
          color: #555555;
        }
        .info-grid {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .info-grid td {
          width: 50%;
          vertical-align: top;
          padding: 10px 15px;
          background-color: #fcfbfa;
          border: 1px solid #eee8df;
        }
        .info-title {
          font-size: 10px;
          font-weight: 750;
          color: #c29958;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 6px;
        }
        .info-content {
          font-size: 12px;
          color: #333333;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 35px;
        }
        .items-table th {
          background-color: #f7f2ea;
          border: 1px solid #eee8df;
          color: #222222;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 1px;
          padding: 10px;
          text-align: left;
        }
        .items-table td {
          padding: 12px 10px;
          border-bottom: 1px solid #eee8df;
          vertical-align: top;
        }
        .items-table .item-row:hover {
          background-color: #fafaf9;
        }
        .product-name {
          font-weight: 600;
          color: #222222;
        }
        .product-sku {
          font-size: 10px;
          color: #777777;
          margin-top: 2px;
        }
        .text-center {
          text-align: center;
        }
        .text-right {
          text-align: right;
        }
        .financial-table {
          width: 280px;
          margin-left: auto;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .financial-table td {
          padding: 6px 10px;
          font-size: 12px;
        }
        .financial-table .total-row td {
          font-weight: 700;
          font-size: 14px;
          border-top: 2px solid #222222;
          padding-top: 10px;
          color: #c29958;
        }
        .discount-text {
          color: #e11d48;
          font-weight: 600;
        }
        .footer-note {
          text-align: center;
          margin-top: 50px;
          font-size: 11px;
          color: #888888;
          border-top: 1px dashed #eee8df;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- HEADER -->
        <table class="header-table">
          <tr>
            <td>
              <div class="brand-logo">ZenVora</div>
              <div class="brand-subtitle">Handcrafted Jewelry</div>
            </td>
            <td class="invoice-meta">
              <div class="invoice-title">Tax Invoice</div>
              <div><strong>Invoice No:</strong> ${order.orderNumber}</div>
              <div><strong>Date:</strong> ${formattedDate}</div>
              <div><strong>Payment Method:</strong> ${order.paymentMethod} (${order.paymentStatus})</div>
            </td>
          </tr>
        </table>

        <!-- BILLING & SHIPPING -->
        <table class="info-grid">
          <tr>
            <td style="border-right: none;">
              <div class="info-title">Shipped To</div>
              <div class="info-content">
                <strong>${order.fullname}</strong><br>
                ${order.addressLine1}<br>
                ${order.addressLine2 ? order.addressLine2 + "<br>" : ""}
                ${order.landmark ? "Near: " + order.landmark + "<br>" : ""}
                ${order.city}, ${order.state} - ${order.postalCode}<br>
                ${order.country}<br>
                Phone: ${order.phoneNumber}
              </div>
            </td>
            <td>
              <div class="info-title">Seller Details</div>
              <div class="info-content">
                <strong>ZenVora Handcrafted Jewelry</strong><br>
                Corporate Office: 456 Luxury Blvd, Sector 5<br>
                DLF Phase 3, Gurugram, HR - 122002<br>
                GSTIN: 06AAAFF1234F1Z0<br>
                Email: care@zenvoraa.in<br>
                Website: www.zenvoraa.in
              </div>
            </td>
          </tr>
        </table>

        <!-- ITEMS TABLE -->
        <table class="items-table">
          <thead>
            <tr>
              <th>Item Details</th>
              <th class="text-center" style="width: 80px;">Quantity</th>
              <th class="text-right" style="width: 110px;">Unit Price</th>
              <th class="text-right" style="width: 120px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- FINANCIALS -->
        <table class="financial-table">
          <tr>
            <td>Subtotal:</td>
            <td class="text-right">₹${subtotal}</td>
          </tr>
          ${
            parseFloat(discount) > 0
              ? `
          <tr>
            <td class="discount-text">Discount:</td>
            <td class="text-right discount-text">-₹${discount}</td>
          </tr>`
              : ""
          }
          <tr>
            <td>Shipping:</td>
            <td class="text-right">${parseFloat(shipping) === 0 ? "Free" : "₹" + shipping}</td>
          </tr>
          <tr>
            <td>Estimated Taxes (GST):</td>
            <td class="text-right">₹${tax}</td>
          </tr>
          <tr class="total-row">
            <td>Total Paid:</td>
            <td class="text-right">₹${total}</td>
          </tr>
        </table>

        <!-- FOOTER -->
        <div class="footer-note">
          This is a computer-generated tax invoice. No signature is required. <br>
          Thank you for choosing ZenVora. For support or returns, please email support@zenvoraa.in.
        </div>
      </div>
    </body>
    </html>
  `;
}
