import { jsPDF } from "jspdf";

// ---------------------------------------------------------------------------
// Client-side invoice generator.
//
// Everything here runs purely in the browser from the order object we already
// have on the Orders page — nothing is persisted to the database. The PDF is
// built with jsPDF and triggered as a normal browser download.
// ---------------------------------------------------------------------------

// Shop identity shown on the invoice header. Adjust these to match your brand.
const SHOP = {
  name: "My Ecommerce",
  tagline: "Quality goods, delivered.",
  // Invoice "from" details (address / contact / tax id)
  addressLines: ["123 Market Street", "Bengaluru, Karnataka 560001", "India"],
  email: "support@myecommerce.example",
  phone: "+91 90000 00000",
  gstin: "29ABCDE1234F1Z5",
};

const money = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Map internal status / payment status to friendly invoice wording.
const STATUS_LABELS = {
  return_in_transit: "Returning to us",
  replacement_requested: "Replacement requested",
  replacement_out: "Replacement on its way",
  replacement_completed: "Replacement completed",
};
const statusLabel = (status) => {
  if (!status) return "Placed";
  if (STATUS_LABELS[status]) return STATUS_LABELS[status];
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const PAYMENT_LABELS = {
  pending: "Pending",
  paid: "Paid",
  refund_pending: "Refund pending",
  refunded: "Refunded",
};
const paymentLabel = (paymentStatus) =>
  PAYMENT_LABELS[paymentStatus] || (paymentStatus || "—");

// Which payment method string to show. We prefer the gateway reference but
// fall back to a generic label when there's nothing stored.
const paymentMethodLine = (order) => {
  const provider = order.payment?.provider;
  if (provider === "stripe") return "Card (Stripe)";
  return "Card";
};

// Draws a small label/value pair at a given x,y and returns the new y.
const drawField = (doc, label, value, x, y, maxWidth = 78) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(label.toUpperCase(), x, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  const lines = doc.splitTextToSize(String(value ?? "—"), maxWidth);
  doc.text(lines, x, y + 5);
  return y + 5 + lines.length * 5;
};

export const downloadInvoice = (order) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentRight = pageWidth - margin;
  let y = margin;

  // --- Header band ---------------------------------------------------------
  doc.setFillColor(79, 70, 229); // indigo-600
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(SHOP.name, margin, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(SHOP.tagline, margin, 21);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("INVOICE", contentRight, 17, { align: "right" });

  y = 40;

  // --- Shop details (left) + Invoice meta (right) --------------------------
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Billed from", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  SHOP.addressLines.forEach((line, i) => {
    doc.text(line, margin, y + 5 + i * 4.5);
  });
  let leftBottom = y + 5 + SHOP.addressLines.length * 4.5;
  doc.text(SHOP.email, margin, leftBottom);
  doc.text(SHOP.phone, margin, leftBottom + 4.5);
  doc.text(`GSTIN: ${SHOP.gstin}`, margin, leftBottom + 9);

  // Invoice meta block (right aligned)
  const metaX = contentRight;
  const metaLabelX = contentRight - 40;
  const drawMeta = (label, value, row) => {
    const ry = y + row * 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(label, metaLabelX, ry, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(String(value), metaX, ry, { align: "right" });
  };
  drawMeta("Invoice no.", `INV-${order.orderNumber || order._id}`, 0);
  drawMeta("Order no.", order.orderNumber || "—", 1);
  drawMeta("Order date", formatDate(order.createdAt), 2);
  drawMeta("Order status", statusLabel(order.status), 3);
  drawMeta("Payment status", paymentLabel(order.paymentStatus), 4);
  drawMeta("Payment method", paymentMethodLine(order), 5);

  y = Math.max(leftBottom + 14, y + 6 * 6) + 6;

  // --- Divider -------------------------------------------------------------
  doc.setDrawColor(225, 225, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, y, contentRight, y);
  y += 8;

  // --- Bill to / Ship to (two columns) ------------------------------------
  const colGap = 8;
  const colWidth = (contentRight - margin - colGap) / 2;
  const rightColX = margin + colWidth + colGap;

  const addr = order.shippingAddress || {};
  const shipLines = [
    addr.fullName,
    addr.addressLine1,
    addr.addressLine2,
    [addr.city, addr.state].filter(Boolean).join(", ") +
      (addr.pincode ? ` - ${addr.pincode}` : ""),
    addr.country,
    addr.phone ? `Phone: ${addr.phone}` : null,
  ].filter(Boolean);

  drawField(doc, "Billed to", order.contactEmail, margin, y, colWidth);
  // Ship-to address
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("DELIVERY ADDRESS", rightColX, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  const shipWrapped = doc.splitTextToSize(shipLines.join("\n"), colWidth);
  doc.text(shipWrapped, rightColX, y + 5);

  y += 5 + Math.max(shipLines.length, 1) * 5 + 8;

  // --- Items table ---------------------------------------------------------
  // Columns: Item | Color/Size | Qty | Unit price | Amount
  const cols = {
    item: margin,
    variant: margin + 78,
    qty: margin + 108,
    unit: margin + 126,
    amount: contentRight,
  };

  const drawTableHeader = () => {
    doc.setFillColor(245, 245, 248);
    doc.rect(margin, y, contentRight - margin, 9, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(90, 90, 90);
    doc.text("ITEM", cols.item + 2, y + 6);
    doc.text("VARIANT", cols.variant, y + 6);
    doc.text("QTY", cols.qty, y + 6, { align: "right" });
    doc.text("UNIT PRICE", cols.unit, y + 6, { align: "right" });
    doc.text("AMOUNT", cols.amount, y + 6, { align: "right" });
    y += 9;
  };

  drawTableHeader();

  const rowHeight = 9;
  (order.items || []).forEach((item, index) => {
    // Page break if we're running out of room
    if (y + rowHeight > pageHeight - 40) {
      doc.addPage();
      y = margin;
      drawTableHeader();
    }

    if (index % 2 === 1) {
      doc.setFillColor(252, 252, 253);
      doc.rect(margin, y, contentRight - margin, rowHeight, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 30);
    const titleLines = doc.splitTextToSize(item.title || "Item", 72);
    doc.text(titleLines[0], cols.item + 2, y + 6);

    doc.setTextColor(90, 90, 90);
    doc.setFontSize(8.5);
    doc.text(
      [item.color, item.size].filter(Boolean).join(" / ") || "—",
      cols.variant,
      y + 6,
    );

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9.5);
    doc.text(String(item.quantity), cols.qty, y + 6, { align: "right" });
    doc.text(money(item.price), cols.unit, y + 6, { align: "right" });
    doc.text(
      money(item.price * item.quantity),
      cols.amount,
      y + 6,
      { align: "right" },
    );

    y += rowHeight;
    doc.setDrawColor(235, 235, 235);
    doc.line(margin, y, contentRight, y);
  });

  y += 6;

  // --- Totals --------------------------------------------------------------
  const totalsX = contentRight - 70;
  const totalsValueX = contentRight;
  const drawTotal = (label, value, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 11 : 9.5);
    doc.setTextColor(bold ? 30 : 90, bold ? 30 : 90, bold ? 30 : 90);
    doc.text(label, totalsX, y);
    doc.setTextColor(30, 30, 30);
    doc.text(value, totalsValueX, y, { align: "right" });
    y += bold ? 8 : 6;
  };

  drawTotal("Subtotal", money(order.subtotal));
  drawTotal(
    `Shipping (${order.deliveryMethod || "Standard"})`,
    money(order.shipping),
  );
  drawTotal("Taxes", money(order.taxes));

  // Divider above grand total
  doc.setDrawColor(220, 220, 220);
  doc.line(totalsX, y - 2, contentRight, y - 2);
  y += 3;
  drawTotal("Total", money(order.total), true);

  // --- Refund note (when applicable) --------------------------------------
  if (
    order.paymentStatus === "refund_pending" ||
    order.paymentStatus === "refunded"
  ) {
    const refundAmount = order.cancellation?.refundAmount ?? order.total;
    y += 2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(180, 120, 0);
    doc.text(
      order.paymentStatus === "refunded"
        ? `Refund of ${money(refundAmount)} processed.`
        : `Refund of ${money(refundAmount)} pending.`,
      totalsX,
      y,
    );
    y += 6;
  }

  // --- Footer --------------------------------------------------------------
  const footerY = pageHeight - 22;
  doc.setDrawColor(225, 225, 225);
  doc.line(margin, footerY, contentRight, footerY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text(
    "This is a computer-generated invoice and does not require a signature.",
    margin,
    footerY + 5,
  );
  doc.text(
    `For support, contact ${SHOP.email}`,
    margin,
    footerY + 9.5,
  );
  doc.text(
    `Generated on ${formatDate(new Date())}`,
    contentRight,
    footerY + 5,
    { align: "right" },
  );

  // --- Save ----------------------------------------------------------------
  doc.save(`Invoice-${order.orderNumber || order._id}.pdf`);
};
