import mongoose from "mongoose";
import { Order } from "../Modals/order.modal.js";
import { Cart } from "../Modals/cart.modal.js";
import { Product } from "../Modals/product.modal.js";
import { sendOrderStatusEmail } from "../utils/email.js";
import { getStripe, getClientUrl } from "../utils/stripe.js";

const TAX_RATE = 0.0863;

// Currency sent to Stripe. Indian accounts (and anyone charging domestic
// customers) use "inr". Stripe India only allows foreign currencies for
// registered businesses that have enabled international payments, so keep
// this on the domestic currency unless you've been onboarded for that.
const STRIPE_CURRENCY = "inr";

// All money is stored in the shop's major unit (e.g. rupees). Stripe only
// speaks in the smallest unit (paise, i.e. 1/100 of a rupee), so convert at
// the boundary by multiplying by 100.
const toStripeAmount = (amount) => Math.round(Number(amount) * 100);

// Fire-and-forget order email so a mail failure never breaks the API
// response. Logs (rather than throws) on failure.
const notifyOrderStatus = (order) => {
  sendOrderStatusEmail(order).catch((err) =>
    console.error("Order status email failed:", err.message)
  );
};

// Generate a human-friendly order number, e.g. "ORD-482913"
const generateOrderNumber = () =>
  `ORD-${Date.now().toString().slice(-6)}${Math.floor(
    Math.random() * 90 + 10
  )}`;

// Statuses in which the customer can no longer cancel their order.
//  • shipped   → goods are with the courier; must be received back first
//  • the rest  → already finalised / on their way back / being replaced
const NON_CANCELLABLE_STATUSES = [
  "shipped",
  "delivered",
  "return_in_transit",
  "cancelled",
  "refunded",
  "replacement_requested",
  "replacement_out",
  "replacement_completed",
];

// Put the ordered quantities back into product variant stock. Called when an
// order is cancelled (the mirror of the decrement done at order time).
const restockOrderItems = async (order) => {
  await Promise.all(
    (order.items || [])
      .filter((item) => item.product)
      .map((item) =>
        Product.updateOne(
          {
            _id: item.product,
            "variants.color": item.color,
            "variants.size": item.size,
          },
          { $inc: { "variants.$.stock": item.quantity } }
        )
      )
  );
};

// Remove one replacement unit per ordered item from stock. Called when a
// replacement is dispatched (the mirror of restockOrderItems). Kept as its own
// helper so replacement logic never reuses / mutates cancellation paths.
const deductReplacementStock = async (order) => {
  await Promise.all(
    (order.items || [])
      .filter((item) => item.product)
      .map((item) =>
        Product.updateOne(
          {
            _id: item.product,
            "variants.color": item.color,
            "variants.size": item.size,
          },
          { $inc: { "variants.$.stock": -item.quantity } }
        )
      )
  );
};

// Shared cancellation logic for both customer and admin cancellations.
// `cancelledBy` is "user" or "admin"; `reason` is optional free text.
//
// Two-stage stock handling (no oversell):
//   • Not yet shipped  → the goods never left the warehouse, so the order is
//     cancelled immediately and stock goes back on the shelf right away.
//   • Already shipped  → the item is with the courier / customer, so it
//     becomes "return_in_transit". Stock is NOT restored and no refund is
//     issued until an admin confirms the item is back at the store
//     (see receiveReturn).
const applyCancellation = async (order, { cancelledBy, reason }) => {
  const wasShipped = order.status === "shipped";

  order.status = wasShipped ? "return_in_transit" : "cancelled";
  // Money was collected at checkout, so a refund is now owed.
  order.paymentStatus = "refund_pending";
  order.cancellation = {
    cancelledBy,
    reason: reason || "",
    cancelledAt: new Date(),
    wasShipped,
    refundStatus: "pending",
    refundAmount: order.total,
    stockRestored: false,
  };
  await order.save();

  // Only restock straight away when the goods never left the warehouse.
  if (!wasShipped) {
    await restockOrderItems(order);
    order.cancellation.stockRestored = true;
    await order.save();
  }

  notifyOrderStatus(order);
  return order;
};

// ---------------------------------------------------------------------------
// STRIPE CHECKOUT
// ---------------------------------------------------------------------------
// The client posts the same checkout payload it always did, but instead of
// creating the order immediately we:
//   1. validate stock + build the line items (shared helpers below),
//   2. create a Stripe Checkout Session for the exact server-computed total,
//   3. return the hosted Stripe URL for the browser to redirect to.
// The order itself is only created once Stripe confirms payment — so we never
// reserve stock for an abandoned checkout.

// Validate the requested lines against live stock and return order items plus
// the money breakdown. `cartItems` shape: { product (populated), quantity,
// color, size }. Throws an Error with a user-friendly `.statusCode` on failure
// so callers can surface it directly.
const buildOrderItemsFromCart = async (userId) => {
  const cart = await Cart.findOne({ userId }).populate("items.product");
  if (!cart || cart.items.length === 0) {
    const err = new Error("Your cart is empty");
    err.statusCode = 400;
    throw err;
  }

  const items = cart.items
    .filter((item) => item.product)
    .map((item) => ({
      product: item.product._id,
      title: item.product.title,
      price: item.product.price,
      image: item.product.images?.[0] || "",
      quantity: item.quantity,
      color: item.color,
      size: item.size,
      _product: item.product,
    }));

  if (items.length === 0) {
    const err = new Error("Your cart has no valid products");
    err.statusCode = 400;
    throw err;
  }

  for (const item of items) {
    const variant = (item._product.variants || []).find(
      (v) => v.color === item.color && v.size === item.size
    );
    const available = variant ? variant.stock : 0;
    if (available < item.quantity) {
      const err = new Error(
        `"${item.title}" (${item.color} / ${item.size}) only has ${available} left in stock.`
      );
      err.statusCode = 400;
      throw err;
    }
  }

  return items.map(({ _product, ...rest }) => rest);
};

// Same idea as buildOrderItemsFromCart but for explicit "Buy now" lines.
const buildOrderItemsFromDirect = async (rawItems) => {
  const productIds = rawItems.map((item) => item.productId);
  if (productIds.some((id) => !mongoose.isValidObjectId(id))) {
    const err = new Error("Invalid product ID");
    err.statusCode = 400;
    throw err;
  }
  const products = await Product.find({ _id: { $in: productIds } });
  const productById = new Map(
    products.map((product) => [product._id.toString(), product])
  );

  const items = [];
  for (const item of rawItems) {
    const product = productById.get(String(item.productId));
    const quantity = Number(item.quantity) || 1;
    if (!product) {
      const err = new Error("A product in your order was not found");
      err.statusCode = 404;
      throw err;
    }
    if (quantity < 1) {
      const err = new Error("quantity must be at least 1");
      err.statusCode = 400;
      throw err;
    }
    const variant = (product.variants || []).find(
      (v) => v.color === item.color && v.size === item.size
    );
    const available = variant ? variant.stock : 0;
    if (available < quantity) {
      const err = new Error(
        `"${product.title}" (${item.color} / ${item.size}) only has ${available} left in stock.`
      );
      err.statusCode = 400;
      throw err;
    }
    items.push({
      product: product._id,
      title: product.title,
      price: product.price,
      image: product.images?.[0] || "",
      quantity,
      color: item.color,
      size: item.size,
    });
  }
  return items;
};

// Compute subtotal / taxes / shipping / total from order items.
const computeTotals = (items, shipping = 0) => {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const taxes = Number((subtotal * TAX_RATE).toFixed(2));
  const shippingCost = Number(shipping) || 0;
  const total = Number((subtotal + shippingCost + taxes).toFixed(2));
  return { subtotal, taxes, shipping: shippingCost, total };
};

// Validate the checkout payload shared by both flows (contact + address).
const validateCheckoutPayload = ({ userId, contactEmail, shippingAddress }) => {
  if (!userId) return "userId is required";
  if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return "A valid contact email is required";
  }
  if (
    !shippingAddress ||
    !shippingAddress.fullName ||
    !shippingAddress.addressLine1 ||
    !shippingAddress.city ||
    !shippingAddress.pincode
  ) {
    return "A complete shipping address is required";
  }
  return null;
};

// CREATE CHECKOUT SESSION (post)
// Builds a Stripe Checkout Session for the user's cart (or "Buy now" items)
// and returns the hosted payment page URL. The order is created later, when
// payment succeeds (see confirmCheckout).
export const createCheckoutSession = async (req, res) => {
  try {
    const {
      userId,
      contactEmail,
      shippingAddress,
      deliveryMethod = "Standard",
      shipping = 0,
      items: rawItems,
    } = req.body;

    const validationError = validateCheckoutPayload({
      userId,
      contactEmail,
      shippingAddress,
    });
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const isDirect = Array.isArray(rawItems) && rawItems.length > 0;
    const items = isDirect
      ? await buildOrderItemsFromDirect(rawItems)
      : await buildOrderItemsFromCart(userId);

    const totals = computeTotals(items, shipping);
    const stripe = getStripe();
    const clientUrl = getClientUrl();
    // Session id is echoed back as a query param so the client can ask the
    // backend to finalise the order (and, defensively, so a webhook could too).
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        ...items.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: STRIPE_CURRENCY,
            unit_amount: toStripeAmount(item.price),
            product_data: {
              name: item.title,
              description: `${item.color} / ${item.size}`,
              ...(item.image ? { images: [item.image] } : {}),
            },
          },
        })),
        // Shipping + taxes are sent as their own lines so the Stripe total
        // matches our order total exactly.
        ...(totals.shipping > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: STRIPE_CURRENCY,
                  unit_amount: toStripeAmount(totals.shipping),
                  product_data: { name: `${deliveryMethod} shipping` },
                },
              },
            ]
          : []),
        ...(totals.taxes > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: STRIPE_CURRENCY,
                  unit_amount: toStripeAmount(totals.taxes),
                  product_data: { name: "Taxes" },
                },
              },
            ]
          : []),
      ],
      customer_email: contactEmail,
      // The full order payload is stashed on the session so confirmCheckout
      // can rebuild the exact same order without trusting the client again.
      metadata: {
        userId,
        isDirect: isDirect ? "true" : "false",
        deliveryMethod,
        shipping: String(totals.shipping),
        contactEmail,
        shippingAddress: JSON.stringify(shippingAddress),
        // Stripe metadata values max at 500 chars; our items are small
        // (id, qty, color, size) so this fits comfortably.
        directItems: isDirect
          ? JSON.stringify(
              rawItems.map((i) => ({
                productId: i.productId,
                color: i.color,
                size: i.size,
                quantity: Number(i.quantity) || 1,
              }))
            )
          : "",
      },
      success_url: `${clientUrl}/checkout?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/checkout?canceled=true`,
    });

    return res.status(200).json({
      success: true,
      message: "Checkout session created",
      data: { url: session.url, sessionId: session.id },
    });
  } catch (err) {
    console.error("createCheckoutSession error:", {
      type: err.type,
      code: err.code,
      message: err.message,
      raw: err.raw?.message,
    });
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

// CONFIRM CHECKOUT (post)
// Called by the client after Stripe redirects back with ?success=true. Verifies
// the session was actually paid, then creates the order from the stashed
// metadata — decrementing stock and clearing the cart exactly like the old
// direct flow. Idempotent: re-calling with the same session returns the
// already-created order instead of duplicating it.
export const confirmCheckout = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res
        .status(400)
        .json({ success: false, message: "sessionId is required" });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    if (session.payment_status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment has not been completed for this session.",
      });
    }

    // Already finalised? Return the existing order (idempotent).
    if (session.metadata?.orderId) {
      const existing = await Order.findById(session.metadata.orderId);
      if (existing) {
        return res.status(200).json({
          success: true,
          message: "Order already confirmed",
          data: existing,
        });
      }
    }

    const {
      userId,
      isDirect,
      deliveryMethod,
      shipping,
      contactEmail,
      shippingAddress: shippingAddressRaw,
      directItems,
    } = session.metadata || {};

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "Session is missing order data" });
    }

    const shippingAddress = shippingAddressRaw
      ? JSON.parse(shippingAddressRaw)
      : null;
    const shippingCost = Number(shipping) || 0;

    const direct = isDirect === "true";
    // Rebuild the items from the trusted session metadata.
    const items = direct
      ? await buildOrderItemsFromDirect(JSON.parse(directItems || "[]"))
      : await buildOrderItemsFromCart(userId);

    const totals = computeTotals(items, shippingCost);

    // Capture the Stripe payment reference for refunds / reconciliation.
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || "";

    const order = await Order.create({
      userId,
      orderNumber: generateOrderNumber(),
      contactEmail,
      items,
      shippingAddress,
      deliveryMethod: deliveryMethod || "Standard",
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      taxes: totals.taxes,
      total: totals.total,
      status: "placed",
      paymentStatus: "paid",
      payment: {
        provider: "stripe",
        sessionId: session.id,
        paymentIntentId,
      },
    });

    // Decrement stock now that the order is confirmed paid.
    await Promise.all(
      items.map((item) =>
        Product.updateOne(
          {
            _id: item.product,
            "variants.color": item.color,
            "variants.size": item.size,
          },
          { $inc: { "variants.$.stock": -item.quantity } }
        )
      )
    );

    // Clear the cart for cart-based checkouts (Buy now leaves it untouched).
    if (!direct) {
      const cart = await Cart.findOne({ userId });
      if (cart) {
        cart.items = [];
        cart.subtotal = 0;
        await cart.save();
      }
    }

    // Tag the session so a retry/webhook can find this order again.
    try {
      await stripe.checkout.sessions.update(session.id, {
        metadata: { ...(session.metadata || {}), orderId: String(order._id) },
      });
    } catch (metaErr) {
      // Non-fatal: the order already exists; just log it.
      console.error("Could not tag session metadata:", metaErr.message);
    }

    notifyOrderStatus(order);

    return res.status(201).json({
      success: true,
      message: "Order confirmed successfully",
      data: order,
    });
  } catch (err) {
    console.error("confirmCheckout error:", {
      type: err.type,
      code: err.code,
      message: err.message,
      raw: err.raw?.message,
    });
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

// STRIPE WEBHOOK (post)
// Backup path: if the browser never returns (closed tab), Stripe still tells us
// the checkout completed so the order is created exactly once. Signature is
// verified with STRIPE_WEBHOOK_SECRET; when that secret is unset the handler is
// disabled (the success-redirect path still works).
export const stripeWebhook = async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res
      .status(400)
      .json({ success: false, message: "Stripe webhook secret not configured" });
  }

  let event;
  try {
    const stripe = getStripe();
    const signature = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(
      req.body, // raw body — see express.raw() mount in index.js
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error("Stripe webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      // Reuse the same confirmation logic via the shared metadata path.
      if (session.payment_status === "paid" && session.metadata?.userId) {
        const fakeReq = { body: { sessionId: session.id } };
        let done = false;
        const fakeRes = {
          status() {
            return this;
          },
          json() {
            done = true;
            return this;
          },
        };
        await confirmCheckout(fakeReq, fakeRes);
        if (done) {
          return res.status(200).json({ received: true });
        }
      }
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Stripe webhook handling error:", err.message);
    return res.status(500).json({ received: false });
  }
};

// CREATE ORDER (post)
// Accepts the checkout payload (contact email, shipping address,
// delivery method) and builds the order from the user's current cart.
// Products are snapshotted into the order, then the cart is emptied.
export const createOrder = async (req, res) => {
  try {
    const {
      userId,
      contactEmail,
      shippingAddress,
      deliveryMethod = "Standard",
      shipping = 0,
    } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId is required" });
    }
    if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return res
        .status(400)
        .json({ success: false, message: "A valid contact email is required" });
    }
    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.addressLine1 ||
      !shippingAddress.city ||
      !shippingAddress.pincode
    ) {
      return res
        .status(400)
        .json({ success: false, message: "A complete shipping address is required" });
    }

    const cart = await Cart.findOne({ userId }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Your cart is empty" });
    }

    const items = cart.items
      .filter((item) => item.product)
      .map((item) => ({
        product: item.product._id,
        title: item.product.title,
        price: item.product.price,
        image: item.product.images?.[0] || "",
        quantity: item.quantity,
        color: item.color,
        size: item.size,
        // keep the populated product so we can validate/update stock below
        _product: item.product,
      }));

    if (items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Your cart has no valid products" });
    }

    // Validate stock for every line before doing anything destructive
    for (const item of items) {
      const variant = (item._product.variants || []).find(
        (v) => v.color === item.color && v.size === item.size
      );
      const available = variant ? variant.stock : 0;
      if (available < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `"${item.title}" (${item.color} / ${item.size}) only has ${available} left in stock.`,
        });
      }
    }

    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const taxes = Number((subtotal * TAX_RATE).toFixed(2));
    const shippingCost = Number(shipping) || 0;
    const total = Number((subtotal + shippingCost + taxes).toFixed(2));

    const order = await Order.create({
      userId,
      orderNumber: generateOrderNumber(),
      contactEmail,
      items: items.map(({ _product, ...rest }) => rest),
      shippingAddress,
      deliveryMethod,
      subtotal,
      shipping: shippingCost,
      taxes,
      total,
      status: "placed",
    });

    // Reduce stock for the ordered variants now that the order is placed.
    // Stock lives on each variant (matched by color + size).
    await Promise.all(
      items.map((item) =>
        Product.updateOne(
          { _id: item.product, "variants.color": item.color, "variants.size": item.size },
          { $inc: { "variants.$.stock": -item.quantity } }
        )
      )
    );

    // Clear the cart now that the order is placed
    cart.items = [];
    cart.subtotal = 0;
    await cart.save();

    // Send the confirmation email (non-blocking)
    notifyOrderStatus(order);

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (err) {
    console.error("createOrder error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// CREATE DIRECT ORDER (post) — "Buy now".
// Accepts explicit line items ({ productId, color, size, quantity }) so a
// single product can be ordered straight from its page. The cart is NOT read
// and NOT modified — this path is fully independent of the shopping bag.
export const createDirectOrder = async (req, res) => {
  try {
    const {
      userId,
      contactEmail,
      shippingAddress,
      deliveryMethod = "Standard",
      shipping = 0,
      items: rawItems,
    } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId is required" });
    }
    if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return res
        .status(400)
        .json({ success: false, message: "A valid contact email is required" });
    }
    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.addressLine1 ||
      !shippingAddress.city ||
      !shippingAddress.pincode
    ) {
      return res
        .status(400)
        .json({ success: false, message: "A complete shipping address is required" });
    }
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "At least one item is required" });
    }

    // Load the products referenced by the requested items
    const productIds = rawItems.map((item) => item.productId);
    if (productIds.some((id) => !mongoose.isValidObjectId(id))) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }
    const products = await Product.find({ _id: { $in: productIds } });
    const productById = new Map(
      products.map((product) => [product._id.toString(), product])
    );

    const items = [];
    for (const item of rawItems) {
      const product = productById.get(String(item.productId));
      const quantity = Number(item.quantity) || 1;
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "A product in your order was not found" });
      }
      if (quantity < 1) {
        return res
          .status(400)
          .json({ success: false, message: "quantity must be at least 1" });
      }
      const variant = (product.variants || []).find(
        (v) => v.color === item.color && v.size === item.size
      );
      const available = variant ? variant.stock : 0;
      if (available < quantity) {
        return res.status(400).json({
          success: false,
          message: `"${product.title}" (${item.color} / ${item.size}) only has ${available} left in stock.`,
        });
      }
      items.push({
        product: product._id,
        title: product.title,
        price: product.price,
        image: product.images?.[0] || "",
        quantity,
        color: item.color,
        size: item.size,
      });
    }

    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const taxes = Number((subtotal * TAX_RATE).toFixed(2));
    const shippingCost = Number(shipping) || 0;
    const total = Number((subtotal + shippingCost + taxes).toFixed(2));

    const order = await Order.create({
      userId,
      orderNumber: generateOrderNumber(),
      contactEmail,
      items,
      shippingAddress,
      deliveryMethod,
      subtotal,
      shipping: shippingCost,
      taxes,
      total,
      status: "placed",
    });

    // Reduce stock for the ordered variants now that the order is placed
    await Promise.all(
      items.map((item) =>
        Product.updateOne(
          { _id: item.product, "variants.color": item.color, "variants.size": item.size },
          { $inc: { "variants.$.stock": -item.quantity } }
        )
      )
    );

    // NOTE: the user's cart is intentionally left untouched.

    // Send the confirmation email (non-blocking)
    notifyOrderStatus(order);

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (err) {
    console.error("createDirectOrder error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET ORDERS FOR A USER (get) — newest first
export const getOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: "Fetched orders successfully",
      data: orders,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET SINGLE ORDER (get)
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.isValidObjectId(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order ID" });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Fetched order successfully",
      data: order,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET ALL ORDERS (get) — admin. Newest first, optional ?status= filter.
export const getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: "Fetched all orders successfully",
      data: orders,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// UPDATE ORDER STATUS (patch) — admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const allowed = ["placed", "processing", "shipped", "delivered"];
    if (!mongoose.isValidObjectId(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order ID" });
    }
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowed.join(", ")}`,
      });
    }
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true, runValidators: true }
    );
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Let the customer know their order status changed (non-blocking)
    notifyOrderStatus(order);

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// CANCEL MY ORDER (patch) — customer.
// A customer may cancel only while the order is still "placed" or
// "processing". Once it has shipped (or been delivered) cancellation is
// blocked — they must contact support instead.
export const cancelMyOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId, reason } = req.body;

    if (!mongoose.isValidObjectId(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order ID" });
    }
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Only the order's owner can cancel it.
    if (order.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own orders",
      });
    }

    if (NON_CANCELLABLE_STATUSES.includes(order.status)) {
      const pretty =
        order.status.charAt(0).toUpperCase() + order.status.slice(1);
      return res.status(400).json({
        success: false,
        message:
          order.status === "shipped" || order.status === "delivered"
            ? `This order has been ${order.status} and can no longer be cancelled. Please contact support for help.`
            : order.status === "return_in_transit"
              ? "This order is already on its way back to us."
              : `This order is already ${pretty.toLowerCase()} and cannot be cancelled again.`,
      });
    }

    const cancelled = await applyCancellation(order, {
      cancelledBy: "user",
      reason,
    });

    return res.status(200).json({
      success: true,
      message: cancelled.cancellation?.wasShipped
        ? "Order cancelled. We'll arrange pickup of your parcel and process the refund once it reaches us."
        : "Order cancelled. Your refund will be processed shortly.",
      data: cancelled,
    });
  } catch (err) {
    console.error("cancelMyOrder error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// CANCEL ORDER (patch) — admin.
// Admins can cancel an order at any stage before it is delivered, and even
// recall a shipped order (which sends it to "return_in_transit" until the
// item is received back). Terminal states are rejected.
export const cancelOrderAdmin = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!mongoose.isValidObjectId(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order ID" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (
      [
        "delivered",
        "return_in_transit",
        "cancelled",
        "refunded",
        "replacement_requested",
        "replacement_out",
        "replacement_completed",
      ].includes(order.status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          order.status === "return_in_transit"
            ? "This order is already on its way back. Receive the return to restock it."
            : order.status.startsWith("replacement")
              ? "This order is in a replacement flow and cannot be cancelled."
              : `An order that is already ${order.status} cannot be cancelled.`,
      });
    }

    const wasShipped = order.status === "shipped";
    const cancelled = await applyCancellation(order, {
      cancelledBy: "admin",
      reason,
    });

    return res.status(200).json({
      success: true,
      message: wasShipped
        ? "Shipped order marked as return-in-transit. Stock will be restored once the item is received."
        : "Order cancelled successfully",
      data: cancelled,
    });
  } catch (err) {
    console.error("cancelOrderAdmin error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// RECEIVE RETURN (patch) — admin.
// The moment a returned item physically reaches the store. This is what puts
// stock back on the shelf for an order that was cancelled after shipping, and
// it moves the order from "return_in_transit" to "cancelled" so it becomes
// refundable. Idempotent-ish: re-running on an already-received order is
// rejected.
export const receiveReturn = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.isValidObjectId(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order ID" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.status !== "return_in_transit") {
      return res.status(400).json({
        success: false,
        message:
          order.cancellation?.stockRestored
            ? "This return has already been received and restocked."
            : "Only an order that is return-in-transit can be received.",
      });
    }

    // Restock now that the goods are back at the store.
    await restockOrderItems(order);

    order.status = "cancelled";
    order.cancellation = {
      ...(order.cancellation?.toObject
        ? order.cancellation.toObject()
        : order.cancellation || {}),
      returnedAt: new Date(),
      stockRestored: true,
    };
    await order.save();

    notifyOrderStatus(order);

    return res.status(200).json({
      success: true,
      message:
        "Return received. Stock restored — you can now process the refund.",
      data: order,
    });
  } catch (err) {
    console.error("receiveReturn error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// --- REPLACEMENT (exchange) FLOW ------------------------------------------
// No money changes hands. A delivered order can be exchanged for a brand-new
// unit of the same items. Statuses: replacement_requested → replacement_out →
// replacement_completed. Stock: a unit is deducted when dispatched, and the
// faulty unit is restocked when it reaches the store.

// Statuses from which a replacement can be requested (delivered only — you
// can't exchange something you never received).
const REPLACEABLE_STATUSES = ["delivered"];

const REPLACEMENT_ACTIVE_STATUSES = [
  "replacement_requested",
  "replacement_out",
];

// Verify every ordered item still has enough stock for the replacement unit.
const validateReplacementStock = async (order) => {
  for (const item of order.items || []) {
    if (!item.product) continue;
    const product = await Product.findById(item.product);
    if (!product) {
      return `"${item.title}" is no longer in our catalogue and can't be replaced.`;
    }
    const variant = (product.variants || []).find(
      (v) => v.color === item.color && v.size === item.size,
    );
    const available = variant ? variant.stock : 0;
    if (available < item.quantity) {
      return `"${item.title}" (${item.color} / ${item.size}) is out of stock, so it can't be replaced right now.`;
    }
  }
  return null; // all good
};

// REQUEST REPLACEMENT (patch) — customer.
// Only the order's owner, only for a delivered order, and only once per order.
export const requestReplacement = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId, reason } = req.body;

    if (!mongoose.isValidObjectId(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order ID" });
    }
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    if (order.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only request a replacement for your own orders",
      });
    }

    if (REPLACEMENT_ACTIVE_STATUSES.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "A replacement for this order is already in progress.",
      });
    }
    if (order.status === "replacement_completed") {
      return res.status(400).json({
        success: false,
        message: "This order has already been replaced.",
      });
    }
    if (!REPLACEABLE_STATUSES.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message:
          "A replacement can only be requested for an order that has been delivered.",
      });
    }

    // Don't allow a replacement if we can't actually source the unit.
    const stockIssue = await validateReplacementStock(order);
    if (stockIssue) {
      return res.status(400).json({ success: false, message: stockIssue });
    }

    order.status = "replacement_requested";
    order.replacement = {
      requestedBy: "user",
      reason: reason || "",
      requestedAt: new Date(),
    };
    await order.save();

    notifyOrderStatus(order);

    return res.status(200).json({
      success: true,
      message:
        "Replacement requested. We'll arrange a pickup of the item and send a new one.",
      data: order,
    });
  } catch (err) {
    console.error("requestReplacement error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DISPATCH REPLACEMENT (patch) — admin.
// Approves the request and ships a new unit: deducts a unit from stock and
// moves the order to "replacement_out". No money is involved.
export const dispatchReplacement = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { note } = req.body;

    if (!mongoose.isValidObjectId(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order ID" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.status !== "replacement_requested") {
      return res.status(400).json({
        success: false,
        message:
          order.status === "replacement_out"
            ? "This replacement has already been dispatched."
            : "Only a requested replacement can be dispatched.",
      });
    }

    // The new unit must physically exist before we promise it. (This also
    // re-checks in case stock changed since the request.)
    const stockIssue = await validateReplacementStock(order);
    if (stockIssue) {
      return res.status(400).json({ success: false, message: stockIssue });
    }

    // Take the replacement unit out of inventory.
    await deductReplacementStock(order);

    order.status = "replacement_out";
    order.replacement = {
      ...(order.replacement?.toObject
        ? order.replacement.toObject()
        : order.replacement || {}),
      approvedAt: new Date(),
      replacementStockDeducted: true,
      note: note || order.replacement?.note || "",
    };
    await order.save();

    notifyOrderStatus(order);

    return res.status(200).json({
      success: true,
      message: "Replacement dispatched. A new unit is on its way.",
      data: order,
    });
  } catch (err) {
    console.error("dispatchReplacement error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// COMPLETE REPLACEMENT (patch) — admin.
// The faulty/original unit has reached the store: restock it (if sellable) and
// close the replacement. Money was never involved.
export const completeReplacement = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { note, resellable } = req.body;

    if (!mongoose.isValidObjectId(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order ID" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.status !== "replacement_out") {
      return res.status(400).json({
        success: false,
        message:
          order.status === "replacement_completed"
            ? "This replacement has already been completed."
            : "Only a dispatched replacement can be completed.",
      });
    }

    // Restock the returned original unit unless the admin says it can't be
    // resold (e.g. damaged) — defaults to restocking.
    const shouldRestock = resellable !== false;
    if (shouldRestock) {
      await restockOrderItems(order);
    }

    order.status = "replacement_completed";
    order.replacement = {
      ...(order.replacement?.toObject
        ? order.replacement.toObject()
        : order.replacement || {}),
      returnedAt: new Date(),
      completedAt: new Date(),
      stockRestored: shouldRestock,
      note: note || order.replacement?.note || "",
    };
    await order.save();

    notifyOrderStatus(order);

    return res.status(200).json({
      success: true,
      message: shouldRestock
        ? "Replacement completed and the returned unit restocked."
        : "Replacement completed. The returned unit was not restocked.",
      data: order,
    });
  } catch (err) {
    console.error("completeReplacement error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// REFUND ORDER (patch) — admin.
// Marks a cancelled order's refund as completed. Optionally accepts a
// refund reference (transaction id) and amount; defaults to the order total.
//
// For orders that were cancelled AFTER shipping, the return must have been
// received first (status "cancelled" with stockRestored=true) — we never
// refund an item that is still in transit and whose stock isn't back.
export const refundOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { refundReference, amount } = req.body;

    if (!mongoose.isValidObjectId(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order ID" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.status === "return_in_transit") {
      return res.status(400).json({
        success: false,
        message:
          "This order is still on its way back. Receive the return before refunding.",
      });
    }

    if (order.status !== "cancelled" && order.status !== "refunded") {
      return res.status(400).json({
        success: false,
        message: "Only a cancelled order can be refunded.",
      });
    }

    if (order.cancellation?.refundStatus === "completed") {
      return res.status(400).json({
        success: false,
        message: "This order has already been refunded.",
      });
    }

    const refundAmount =
      amount !== undefined && amount !== null && amount !== ""
        ? Number(amount)
        : order.total;

    if (Number.isNaN(refundAmount) || refundAmount < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Refund amount must be a positive number" });
    }

    order.status = "refunded";
    order.paymentStatus = "refunded";
    order.cancellation = {
      ...(order.cancellation?.toObject
        ? order.cancellation.toObject()
        : order.cancellation || {}),
      refundStatus: "completed",
      refundAmount,
      refundedAt: new Date(),
      refundReference: refundReference || "",
    };
    await order.save();

    notifyOrderStatus(order);

    return res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      data: order,
    });
  } catch (err) {
    console.error("refundOrder error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


