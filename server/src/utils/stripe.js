import Stripe from "stripe";

// Lazily create the Stripe client so a missing key never crashes the app at
// boot. Routes that need Stripe ask for it and get a clear error if unset.
let stripeClient = null;

export const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to your .env to enable payments."
    );
  }
  if (!stripeClient) {
    // Stripe recommends pinning the API version so SDK upgrades don't change
    // behaviour underneath you. Falls back to the SDK default if unset.
    stripeClient = new Stripe(key);
  }
  return stripeClient;
};

// Public base URL of the frontend, used for success/cancel redirects.
export const getClientUrl = () =>
  process.env.CLIENT_URL || "http://localhost:5173";
