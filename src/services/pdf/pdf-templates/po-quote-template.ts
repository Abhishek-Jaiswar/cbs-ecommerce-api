/**
 * Generates the HTML string for the Purchase Order document.
 */
export function poQuoteTemplate(po: any, customNotes?: string): string {
  const itemsHtml = po.items
    .map((item: any) => {
      const unitCost = parseFloat(String(item.unitCost)).toFixed(2);
      const totalCost = (Number(item.quantityOrdered) * Number(item.unitCost)).toFixed(2);
      const variantDetails = [
        item.variant.color ? `Color: ${item.variant.color.name}` : "",
        item.variant.size ? `Size: ${item.variant.size.value}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      return `
        <tr class="item-row">
          <td>
            <div class="product-name">${item.variant.product.name}</div>
            <div class="product-variant">${variantDetails}</div>
            ${item.variant.sku ? `<div class="product-sku">SKU: ${item.variant.sku}</div>` : ""}
          </td>
          <td class="text-center">${item.quantityOrdered}</td>
          <td class="text-right">₹${unitCost}</td>
          <td class="text-right">₹${totalCost}</td>
        </tr>
      `;
    })
    .join("");

  const totalAmount = parseFloat(String(po.totalAmount)).toFixed(2);
  const formattedDate = new Date(po.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const notesHtml = customNotes || po.notes
    ? `<div class="notes-section">
         <div class="notes-title">Instructions & Notes</div>
         <p class="notes-content">${customNotes || po.notes}</p>
       </div>`
    : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Purchase Order - ${po.poNumber}</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #333333;
          margin: 0;
          padding: 0;
          font-size: 13px;
          line-height: 1.6;
        }
        .po-container {
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
        .po-title {
          font-size: 20px;
          font-weight: 700;
          color: #222222;
          text-align: right;
          text-transform: uppercase;
        }
        .po-meta {
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
        .product-name {
          font-weight: 600;
          color: #222222;
        }
        .product-variant {
          font-size: 11px;
          color: #555555;
          margin-top: 2px;
        }
        .product-sku {
          font-size: 10px;
          color: #777777;
          margin-top: 1px;
        }
        .text-center {
          text-align: center;
        }
        .text-right {
          text-align: right;
        }
        .total-box {
          width: 280px;
          margin-left: auto;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .total-box td {
          padding: 10px;
          font-size: 14px;
          font-weight: 700;
          border: 2px solid #222222;
          color: #c29958;
        }
        .notes-section {
          background-color: #f7f2ea;
          border: 1px solid #eee8df;
          padding: 15px;
          margin-bottom: 30px;
        }
        .notes-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #c29958;
          letter-spacing: 1px;
          margin-bottom: 5px;
        }
        .notes-content {
          margin: 0;
          font-size: 12px;
          white-space: pre-wrap;
          color: #555555;
        }
        .footer-note {
          text-align: center;
          margin-top: 60px;
          font-size: 11px;
          color: #888888;
          border-top: 1px dashed #eee8df;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="po-container">
        <!-- HEADER -->
        <table class="header-table">
          <tr>
            <td>
              <div class="brand-logo">ZenVora</div>
              <div class="brand-subtitle">Handcrafted Jewelry</div>
            </td>
            <td class="po-meta">
              <div class="po-title">Purchase Order</div>
              <div><strong>PO Number:</strong> ${po.poNumber}</div>
              <div><strong>Date Issued:</strong> ${formattedDate}</div>
              <div><strong>Fulfillment Status:</strong> ${po.status}</div>
            </td>
          </tr>
        </table>

        <!-- SUPPLIER & SHIP TO -->
        <table class="info-grid">
          <tr>
            <td style="border-right: none;">
              <div class="info-title">Supplier Details</div>
              <div class="info-content">
                <strong>${po.supplier.name}</strong><br>
                ${po.supplier.address || "No address listed"}<br>
                ${po.supplier.contactName ? "Contact: " + po.supplier.contactName + "<br>" : ""}
                ${po.supplier.email ? "Email: " + po.supplier.email + "<br>" : ""}
                ${po.supplier.phone ? "Phone: " + po.supplier.phone : ""}
              </div>
            </td>
            <td>
              <div class="info-title">Ship To (Company)</div>
              <div class="info-content">
                <strong>ZenVora Handcrafted Jewelry</strong><br>
                Central Warehouse - Replenishment Division<br>
                456 Luxury Blvd, Sector 5<br>
                Gurugram, HR - 122002<br>
                GSTIN: 06AAAFF1234F1Z0<br>
                Email: inventory@zenvoraa.in
              </div>
            </td>
          </tr>
        </table>

        <!-- NOTES SECTION -->
        ${notesHtml}

        <!-- ITEMS TABLE -->
        <table class="items-table">
          <thead>
            <tr>
              <th>Replenishment Item</th>
              <th class="text-center" style="width: 80px;">Qty Ordered</th>
              <th class="text-right" style="width: 120px;">Unit Cost</th>
              <th class="text-right" style="width: 140px;">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- TOTAL -->
        <table class="total-box">
          <tr>
            <td>Grand Total Amount:</td>
            <td class="text-right">₹${totalAmount}</td>
          </tr>
        </table>

        <!-- FOOTER -->
        <div class="footer-note">
          This is an official commercial purchase order issued by ZenVora Handcrafted Jewelry. <br>
          Please send all invoices and delivery schedules directly to purchase@zenvoraa.in.
        </div>
      </div>
    </body>
    </html>
  `;
}
