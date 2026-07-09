import PDFDocument from "pdfkit";

// Renders an invoice PDF straight to the given writable stream (e.g. an HTTP response).
// `order` must include: invoice_number, created_at, quantity, price, title, author,
// customer_name, customer_email, tos_accepted_at, signature (a data:image/png;base64,... string).
export function renderInvoicePdf(order, res) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(res);

  const total = (order.price * order.quantity).toFixed(2);
  const issued = new Date(order.created_at).toLocaleString();

  // Header
  doc
    .fontSize(20)
    .fillColor("#7c2a35")
    .text("Bindery & Co.", { continued: false })
    .fontSize(10)
    .fillColor("#555")
    .text("123 Reading Lane, Booktown")
    .moveDown(1.5);

  doc
    .fontSize(16)
    .fillColor("#1c2b39")
    .text(`Invoice ${order.invoice_number}`)
    .fontSize(10)
    .fillColor("#555")
    .text(`Issued: ${issued}`)
    .text(`Order #${order.id}`)
    .moveDown(1);

  // Bill to
  doc
    .fontSize(11)
    .fillColor("#1c2b39")
    .text("Billed to:", { underline: true })
    .fontSize(10)
    .fillColor("#333")
    .text(order.customer_name)
    .text(order.customer_email)
    .moveDown(1.2);

  // Line item table
  const tableTop = doc.y;
  doc.fontSize(10).fillColor("#7a7266");
  doc.text("Item", 50, tableTop);
  doc.text("Qty", 320, tableTop);
  doc.text("Unit Price", 380, tableTop);
  doc.text("Total", 470, tableTop);
  doc
    .moveTo(50, tableTop + 15)
    .lineTo(545, tableTop + 15)
    .strokeColor("#e3d9c6")
    .stroke();

  const rowY = tableTop + 25;
  doc.fillColor("#1c2b39").fontSize(10);
  doc.text(`${order.title}`, 50, rowY, { width: 250 });
  doc.text(`by ${order.author}`, 50, rowY + 13, { width: 250 });
  doc.text(String(order.quantity), 320, rowY);
  doc.text(`$${order.price.toFixed(2)}`, 380, rowY);
  doc.text(`$${total}`, 470, rowY);

  doc
    .moveTo(50, rowY + 45)
    .lineTo(545, rowY + 45)
    .strokeColor("#e3d9c6")
    .stroke();

  doc
    .fontSize(12)
    .fillColor("#1c2b39")
    .text(`Total due: $${total}`, 380, rowY + 55);

  // Terms of service acknowledgement + signature
  const tosY = rowY + 110;
  doc
    .fontSize(10)
    .fillColor("#7a7266")
    .text(
      "By placing this order the customer agreed to Bindery & Co.'s Terms of Service " +
        "and confirmed the order details above, evidenced by the signature below.",
      50,
      tosY,
      { width: 495 }
    );

  const acceptedAt = order.tos_accepted_at
    ? new Date(order.tos_accepted_at).toLocaleString()
    : "N/A";
  doc.text(`Agreed to Terms of Service: ${acceptedAt}`, 50, tosY + 35);

  if (order.signature && order.signature.startsWith("data:image")) {
    const base64 = order.signature.split(",")[1];
    const imgBuffer = Buffer.from(base64, "base64");
    doc.text("Customer signature:", 50, tosY + 55);
    try {
      doc.image(imgBuffer, 50, tosY + 70, { width: 180, height: 70, fit: [180, 70] });
    } catch {
      doc.text("(signature could not be rendered)", 50, tosY + 75);
    }
  } else {
    doc.text("Customer signature: not on file", 50, tosY + 55);
  }

  doc
    .moveTo(50, tosY + 150)
    .lineTo(545, tosY + 150)
    .strokeColor("#e3d9c6")
    .stroke();

  doc
    .fontSize(8)
    .fillColor("#aaa")
    .text("This invoice was generated automatically by Bindery & Co.", 50, tosY + 160);

  doc.end();
}
