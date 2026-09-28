import { Resend } from "resend";
import { renderOrderStatusEmail } from "../emails/Orderstatus.js";

// Create the Resend client lazily. ESM hoists imports, so this module is
// evaluated before index.js calls dotenv.config() — constructing Resend at
// module load would read an empty key. Building it on first use avoids that.
let resendClient = null;
const getResend = () => {
  if (!resendClient) {
    const key = process.env.RESEND_KEY;
    if (!key) {
      throw new Error("RESEND_KEY is not set");
    }
    resendClient = new Resend(key);
  }
  return resendClient;
};

// Where transactional emails are sent "from". onboarding@resend.dev works
// out of the box with Resend's test mode; swap for your verified domain.
const FROM_ADDRESS = process.env.RESEND_FROM || "onboarding@resend.dev";

/**
 * Send an order-status email.
 * @param {object} order - the Mongoose order document (or plain object).
 * @param {object} [options]
 * @param {string} [options.to] - override recipient (defaults to order.contactEmail).
 * @returns {Promise<{id: string}>} the Resend result data.
 */
export const sendOrderStatusEmail = async (order, options = {}) => {
  const to = options.to || order?.contactEmail;
  if (!to) {
    throw new Error("No recipient email address provided for the order");
  }

  const html = await renderOrderStatusEmail(order);
  const statusText = order?.status
    ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
    : "Order placed";

  const { data, error } = await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Order ${order?.orderNumber || ""} — ${statusText}`,
    html,
  });

  if (error) {
    throw new Error(error.message || "Failed to send order status email");
  }
  return data;
};
