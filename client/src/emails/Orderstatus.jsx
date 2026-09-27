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

// The 4 tracking steps, in order. The index matches the order's status.
const STEPS = [
  { key: "placed", label: "Order placed", caption: "we received your order" },
  { key: "processing", label: "Processing", caption: "we're getting your items ready" },
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

// A tracking step rendered as a table cell: a coloured connector bar + label.
// Tables are used because email clients don't support flexbox/grid.
const StepCell = ({ index, current, isFirst, isLast }) => {
  const done = index <= current;
  const active = index === current;

  return (
    <Column
      style={{
        width: "25%",
        verticalAlign: "top",
        textAlign: isFirst ? "left" : isLast ? "right" : "center",
      }}
    >
      <div
        style={{
          height: 4,
          borderRadius: 9999,
          backgroundColor: done ? "#4f46e5" : "#e5e7eb",
          marginLeft: isFirst ? 0 : 2,
          marginRight: isLast ? 0 : 2,
          marginBottom: 10,
        }}
      />
      <Text
        style={{
          margin: 0,
          fontSize: 12,
          fontWeight: done ? 600 : 400,
          color: done ? "#4f46e5" : "#9ca3af",
        }}
      >
        {STEPS[index].label}
      </Text>
    </Column>
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

  return (
    <Html>
      <Head />
      <Preview>
        Your order {orderNumber} is {statusLabel(status).toLowerCase()}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Brand header */}
          <Section style={header}>
            <Text style={brand}>~ Your Company</Text>
          </Section>

          {/* Status hero */}
          <Section style={{ padding: "32px 32px 8px" }}>
            <Text style={eyebrow}>Order update</Text>
            <Heading style={h1}>{statusLabel(status)}</Heading>
            <Text style={paragraph}>
              Hi {shippingAddress.fullName || "there"}, {STEPS[current].caption}
              . Here's the latest on your order <strong>{orderNumber}</strong>
              {createdAt ? `, placed on ${formatDate(createdAt)}` : ""}.
            </Text>
          </Section>

          {/* Progress tracker */}
          <Section style={{ padding: "8px 32px 0" }}>
            <Row>
              {STEPS.map((step, index) => (
                <StepCell
                  key={step.key}
                  index={index}
                  current={current}
                  isFirst={index === 0}
                  isLast={index === STEPS.length - 1}
                />
              ))}
            </Row>
          </Section>

          <Hr style={hr} />

          {/* Line items */}
          <Section style={{ padding: "0 32px" }}>
            <Heading style={h2}>Items ({items.length})</Heading>
            {items.map((item, index) => (
              <Row key={`${item.title}-${index}`} style={itemRow}>
                <Column style={{ width: 64, verticalAlign: "top" }}>
                  {item.image ? (
                    <Img
                      src={item.image}
                      alt={item.title}
                      width="64"
                      height="64"
                      style={itemImage}
                    />
                  ) : null}
                </Column>
                <Column style={{ verticalAlign: "top", paddingLeft: 12 }}>
                  <Text style={itemTitle}>{item.title}</Text>
                  <Text style={itemMeta}>
                    {[item.color, item.size].filter(Boolean).join(" · ")}
                    {item.quantity ? ` · Qty ${item.quantity}` : ""}
                  </Text>
                </Column>
                <Column
                  style={{ width: 90, verticalAlign: "top", textAlign: "right" }}
                >
                  <Text style={itemPrice}>
                    {formatCurrency((item.price || 0) * (item.quantity || 1))}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={hr} />

          {/* Order summary */}
          <Section style={{ padding: "0 32px" }}>
            <Row style={summaryRow}>
              <Column>
                <Text style={summaryLabel}>Subtotal</Text>
              </Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={summaryValue}>{formatCurrency(subtotal)}</Text>
              </Column>
            </Row>
            <Row style={summaryRow}>
              <Column>
                <Text style={summaryLabel}>Shipping</Text>
              </Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={summaryValue}>{formatCurrency(shipping)}</Text>
              </Column>
            </Row>
            <Row style={summaryRow}>
              <Column>
                <Text style={summaryLabel}>Taxes</Text>
              </Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={summaryValue}>{formatCurrency(taxes)}</Text>
              </Column>
            </Row>
            <Hr style={hrLight} />
            <Row>
              <Column>
                <Text style={totalLabel}>Total</Text>
              </Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={totalValue}>{formatCurrency(total)}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          {/* Shipping + contact */}
          <Section style={{ padding: "0 32px" }}>
            <Row>
              <Column style={{ verticalAlign: "top", paddingRight: 12 }}>
                <Text style={h2}>Delivery address</Text>
                <Text style={addressLine}>{shippingAddress.fullName}</Text>
                <Text style={addressLine}>{shippingAddress.addressLine1}</Text>
                {shippingAddress.addressLine2 ? (
                  <Text style={addressLine}>
                    {shippingAddress.addressLine2}
                  </Text>
                ) : null}
                <Text style={addressLine}>
                  {[shippingAddress.city, shippingAddress.state]
                    .filter(Boolean)
                    .join(", ")}
                  {shippingAddress.pincode
                    ? ` - ${shippingAddress.pincode}`
                    : ""}
                </Text>
                <Text style={addressLine}>{shippingAddress.country}</Text>
              </Column>
              <Column style={{ verticalAlign: "top", paddingLeft: 12 }}>
                <Text style={h2}>Contact &amp; shipping</Text>
                <Text style={addressLine}>{contactEmail}</Text>
                <Text style={addressLine}>{shippingAddress.phone}</Text>
                <Text style={addressLine}>{deliveryMethod} delivery</Text>
              </Column>
            </Row>
          </Section>

          {/* CTA */}
          <Section style={{ padding: "8px 32px 32px", textAlign: "center" }}>
            <Button href="https://example.com/orders" style={button}>
              View your order
            </Button>
            <Text style={helpText}>
              Questions? Reply to this email or visit our{" "}
              <Link href="https://example.com/faq" style={link}>
                help center
              </Link>
              .
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Your Company. All rights reserved.
            </Text>
            <Text style={footerText}>
              This is an automated message about your order {orderNumber}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default Orderstatus;

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
