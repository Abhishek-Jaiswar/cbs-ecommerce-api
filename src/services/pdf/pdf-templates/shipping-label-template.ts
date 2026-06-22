/**
 * Generates the HTML string for the physical shipping label.
 * Styled to fit standard 4x6 inch (or similar) dimensions for thermal label printers.
 */
export function shippingLabelTemplate(order: any): string {
  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  const totalQty = order.orderItems.reduce((acc: number, item: any) => acc + item.quantity, 0);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Shipping Label - ${order.orderNumber}</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #000000;
          background-color: #ffffff;
        }
        .label-container {
          width: 380px;
          height: 560px;
          margin: auto;
          padding: 15px;
          border: 4px solid #000000;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .section {
          border-bottom: 2px solid #000000;
          padding: 8px 0;
        }
        .section-last {
          border-bottom: none;
          padding: 8px 0;
        }
        .flex-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .brand-header {
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .carrier-name {
          font-size: 16px;
          font-weight: 800;
          text-transform: uppercase;
          background-color: #000000;
          color: #ffffff;
          padding: 2px 8px;
        }
        .from-details {
          font-size: 9px;
          line-height: 1.2;
        }
        .to-details {
          font-size: 13px;
          font-weight: bold;
          line-height: 1.35;
        }
        .to-title {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 3px;
        }
        .barcode-section {
          text-align: center;
          padding: 15px 0;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .mock-barcode {
          font-family: 'Libre Barcode 39', 'Courier New', Courier, monospace;
          font-size: 46px;
          letter-spacing: -2px;
          margin-bottom: 2px;
          line-height: 1;
        }
        .mock-lines {
          font-size: 34px;
          font-weight: bold;
          letter-spacing: 0.5px;
          transform: scaleY(1.5);
          display: inline-block;
          margin-bottom: 5px;
        }
        .tracking-number {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          font-size: 10px;
        }
        .meta-item {
          border-right: 1px solid #cccccc;
          padding-right: 5px;
        }
        .meta-item:last-child {
          border-right: none;
        }
      </style>
    </head>
    <body>
      <div class="label-container">
        <!-- HEADER ROW -->
        <div class="section flex-row" style="align-items: center; padding-top: 0;">
          <div class="brand-header">ZenVora</div>
          <div class="carrier-name">EXPRESS</div>
        </div>

        <!-- FROM ADDRESS -->
        <div class="section from-details">
          <strong>FROM:</strong><br>
          ZenVora Warehouses - Fulfillment Center 1<br>
          456 Luxury Blvd, Sector 5, Gurugram, HR - 122002<br>
          GSTIN: 06AAAFF1234F1Z0
        </div>

        <!-- TO ADDRESS -->
        <div class="section">
          <div class="to-title">SHIP TO:</div>
          <div class="to-details">
            ${order.fullname}<br>
            ${order.addressLine1}<br>
            ${order.addressLine2 ? order.addressLine2 + "<br>" : ""}
            ${order.landmark ? "Landmark: " + order.landmark + "<br>" : ""}
            ${order.city}, ${order.state} - ${order.postalCode}<br>
            ${order.country}<br>
            Phone: ${order.phoneNumber}
          </div>
        </div>

        <!-- BARCODE & TRACKING -->
        <div class="section barcode-section">
          <div class="mock-lines">||||||| | ||| || |||| ||| | ||| |||||||</div>
          <div class="tracking-number">TRACKING ID: ${order.trackingNumber || "ZV-PENDING-SHIP"}</div>
        </div>

        <!-- BOTTOM METADATA -->
        <div class="section-last meta-grid">
          <div class="meta-item">
            <strong>Order Reference:</strong> ${order.orderNumber}<br>
            <strong>Date:</strong> ${formattedDate}
          </div>
          <div class="meta-item" style="padding-left: 10px;">
            <strong>Items Count:</strong> ${totalQty} units<br>
            <strong>Dimensions:</strong> 4" x 6" A4 Thermal
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
