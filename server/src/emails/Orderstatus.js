import { createElement as h } from "react";
import { render } from "react-email";
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "react-email";

// This template is written with React.createElement (h) instead of JSX so the
// plain-Node server can import it without a build step. It mirrors the design
// of client/src/emails/Orderstatus.jsx.

// The 4 tracking steps, in order. The index matches the order's status.
const STEPS = [
  { key: "placed", label: "Order placed", caption: "we received your order" },
  {
    key: "processing",
    label: "Processing",
    caption: "we're getting your items ready",
  },
  { key: "shipped", label: "Shipped", caption: "your order is on the way" },
  { key: "delivered", label: "Delivered", caption: "your order has arrived" },
];

const statusStep = (status) => {
  const index = STEPS.findIndex((s) => s.key === status);
  return index === -1 ? 0 : index;
};

const statusLabel = (status) => {
  const step = STEPS.find((s) => s.key === status);
  return step ? step.label : "Order placed";
};

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

// A tracking step: a coloured connector bar + label, laid out in a table cell.
const StepCell = ({ index, current, isFirst, isLast }) => {
  const done = index <= current;
  return h(
    Column,
    {
      style: {
        width: "25%",
        verticalAlign: "top",
        textAlign: isFirst ? "left" : isLast ? "right" : "center",
      },
    },
    h("div", {
      style: {
        height: 4,
        borderRadius: 9999,
        backgroundColor: done ? "#4f46e5" : "#e5e7eb",
        marginLeft: isFirst ? 0 : 2,
        marginRight: isLast ? 0 : 2,
        marginBottom: 10,
      },
    }),
    h(
      Text,
      {
        style: {
          margin: 0,
          fontSize: 12,
          fontWeight: done ? 600 : 400,
          color: done ? "#4f46e5" : "#9ca3af",
        },
      },
      STEPS[index].label
    )
  );
};

const Orderstatus = ({ order = {} }) => {
  const {
    orderNumber = "—",
    createdAt,
    status = "placed",
    contactEmail = "",
    items = [],
    shippingAddress = {},
    deliveryMethod = "Standard",
    subtotal = 0,
    shipping = 0,
    taxes = 0,
    total = 0,
  } = order;

  const current = statusStep(status);

  return h(
    Html,
    null,
    h(Head, null),
    h(Preview, null, `Your order ${orderNumber} is ${statusLabel(status).toLowerCase()}`),
    h(
      Body,
      { style: main },
      h(
        Container,
        { style: container },
        // Brand header
        h(
          Section,
          { style: header },
          h(Text, { style: brand }, "~ Your Company")
        ),

        // Status hero
        h(
          Section,
          { style: { padding: "32px 32px 8px" } },
          h(Text, { style: eyebrow }, "Order update"),
          h(Heading, { style: h1 }, statusLabel(status)),
          h(
            Text,
            { style: paragraph },
            `Hi ${shippingAddress.fullName || "there"}, ${STEPS[current].caption}. Here's the latest on your order `,
            h("strong", null, orderNumber),
            createdAt ? `, placed on ${formatDate(createdAt)}` : "",
            "."
          )
        ),

        // Progress tracker
        h(
          Section,
          { style: { padding: "8px 32px 0" } },
          h(
            Row,
            null,
            ...STEPS.map((step, index) =>
              h(StepCell, {
                key: step.key,
                index,
                current,
                isFirst: index === 0,
                isLast: index === STEPS.length - 1,
              })
            )
          )
        ),

        h(Hr, { style: hr }),

        // Line items
        h(
          Section,
          { style: { padding: "0 32px" } },
          h(Heading, { style: h2 }, `Items (${items.length})`),
          ...items.map((item, index) =>
            h(
              Row,
              { key: `${item.title}-${index}`, style: itemRow },
              h(
                Column,
                { style: { width: 64, verticalAlign: "top" } },
                item.image
                  ? h(Img, {
                      src: item.image,
                      alt: item.title,
                      width: "64",
                      height: "64",
                      style: itemImage,
                    })
                  : null
              ),
              h(
                Column,
                { style: { verticalAlign: "top", paddingLeft: 12 } },
                h(Text, { style: itemTitle }, item.title),
                h(
                  Text,
                  { style: itemMeta },
                  [item.color, item.size].filter(Boolean).join(" · ") +
                    (item.quantity ? ` · Qty ${item.quantity}` : "")
                )
              ),
              h(
                Column,
                { style: { width: 90, verticalAlign: "top", textAlign: "right" } },
                h(
                  Text,
                  { style: itemPrice },
                  formatCurrency((item.price || 0) * (item.quantity || 1))
                )
              )
            )
          )
        ),

        h(Hr, { style: hr }),

        // Order summary
        h(
          Section,
          { style: { padding: "0 32px" } },
          h(
            Row,
            { style: summaryRow },
            h(Column, null, h(Text, { style: summaryLabel }, "Subtotal")),
            h(
              Column,
              { style: { textAlign: "right" } },
              h(Text, { style: summaryValue }, formatCurrency(subtotal))
            )
          ),
          h(
            Row,
            { style: summaryRow },
            h(Column, null, h(Text, { style: summaryLabel }, "Shipping")),
            h(
              Column,
              { style: { textAlign: "right" } },
              h(Text, { style: summaryValue }, formatCurrency(shipping))
            )
          ),
          h(
            Row,
            { style: summaryRow },
            h(Column, null, h(Text, { style: summaryLabel }, "Taxes")),
            h(
              Column,
              { style: { textAlign: "right" } },
              h(Text, { style: summaryValue }, formatCurrency(taxes))
            )
          ),
          h(Hr, { style: hrLight }),
          h(
            Row,
            null,
            h(Column, null, h(Text, { style: totalLabel }, "Total")),
            h(
              Column,
              { style: { textAlign: "right" } },
              h(Text, { style: totalValue }, formatCurrency(total))
            )
          )
        ),

        h(Hr, { style: hr }),

        // Shipping + contact
        h(
          Section,
          { style: { padding: "0 32px" } },
          h(
            Row,
            null,
            h(
              Column,
              { style: { verticalAlign: "top", paddingRight: 12 } },
              h(Text, { style: h2 }, "Delivery address"),
              h(Text, { style: addressLine }, shippingAddress.fullName),
              h(Text, { style: addressLine }, shippingAddress.addressLine1),
              shippingAddress.addressLine2
                ? h(Text, { style: addressLine }, shippingAddress.addressLine2)
                : null,
              h(
                Text,
                { style: addressLine },
                [shippingAddress.city, shippingAddress.state]
                  .filter(Boolean)
                  .join(", ") +
                  (shippingAddress.pincode ? ` - ${shippingAddress.pincode}` : "")
              ),
              h(Text, { style: addressLine }, shippingAddress.country)
            ),
            h(
              Column,
              { style: { verticalAlign: "top", paddingLeft: 12 } },
              h(Text, { style: h2 }, "Contact & shipping"),
              h(Text, { style: addressLine }, contactEmail),
              h(Text, { style: addressLine }, shippingAddress.phone),
              h(Text, { style: addressLine }, `${deliveryMethod} delivery`)
            )
          )
        ),

        // CTA
        h(
          Section,
          { style: { padding: "8px 32px 32px", textAlign: "center" } },
          h(
            Button,
            { href: "https://example.com/orders", style: button },
            "View your order"
          ),
          h(
            Text,
            { style: helpText },
            "Questions? Reply to this email or visit our ",
            h(Link, { href: "https://example.com/faq", style: link }, "help center"),
            "."
          )
        ),

        // Footer
        h(
          Section,
          { style: footer },
          h(
            Text,
            { style: footerText },
            `© ${new Date().getFullYear()} Your Company. All rights reserved.`
          ),
          h(
            Text,
            { style: footerText },
            `This is an automated message about your order ${orderNumber}.`
          )
        )
      )
    )
  );
};

export default Orderstatus;

// Render the template to an HTML string for sending via Resend.
export const renderOrderStatusEmail = (order) =>
  render(h(Orderstatus, { order }));

// ---- styles ----
const main = {
  backgroundColor: "#f3f4f6",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  padding: "24px 0",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "600px",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  overflow: "hidden",
};

const header = {
  padding: "24px 32px",
  backgroundColor: "#4f46e5",
};

const brand = {
  margin: 0,
  color: "#ffffff",
  fontSize: 18,
  fontWeight: 700,
};

const eyebrow = {
  margin: 0,
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#6b7280",
};

const h1 = {
  margin: "6px 0 8px",
  fontSize: 24,
  fontWeight: 700,
  color: "#111827",
};

const h2 = {
  margin: "0 0 8px",
  fontSize: 14,
  fontWeight: 600,
  color: "#111827",
};

const paragraph = {
  margin: 0,
  fontSize: 14,
  lineHeight: "22px",
  color: "#4b5563",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "24px 32px",
};

const hrLight = {
  borderColor: "#f3f4f6",
  margin: "8px 0",
};

const itemRow = {
  marginTop: 12,
};

const itemImage = {
  borderRadius: 8,
  objectFit: "cover",
  border: "1px solid #e5e7eb",
};

const itemTitle = {
  margin: 0,
  fontSize: 14,
  fontWeight: 600,
  color: "#111827",
};

const itemMeta = {
  margin: "4px 0 0",
  fontSize: 13,
  color: "#6b7280",
};

const itemPrice = {
  margin: 0,
  fontSize: 14,
  fontWeight: 600,
  color: "#111827",
};

const summaryRow = {
  marginTop: 2,
};

const summaryLabel = {
  margin: 0,
  fontSize: 14,
  color: "#6b7280",
};

const summaryValue = {
  margin: 0,
  fontSize: 14,
  color: "#374151",
};

const totalLabel = {
  margin: "4px 0 0",
  fontSize: 15,
  fontWeight: 700,
  color: "#111827",
};

const totalValue = {
  margin: "4px 0 0",
  fontSize: 15,
  fontWeight: 700,
  color: "#111827",
};

const addressLine = {
  margin: 0,
  fontSize: 13,
  lineHeight: "20px",
  color: "#6b7280",
};

const button = {
  backgroundColor: "#4f46e5",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 600,
  borderRadius: 8,
  padding: "12px 24px",
  textDecoration: "none",
};

const helpText = {
  margin: "16px 0 0",
  fontSize: 13,
  color: "#6b7280",
};

const link = {
  color: "#4f46e5",
  textDecoration: "underline",
};

const footer = {
  padding: "20px 32px",
  backgroundColor: "#f9fafb",
  borderTop: "1px solid #e5e7eb",
};

const footerText = {
  margin: "0 0 4px",
  fontSize: 12,
  color: "#9ca3af",
};
