


import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { CheckCircleIcon, TrashIcon } from "@heroicons/react/20/solid";
import {
  BanknotesIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import useAuth from "../customhooks/useAuth";
import { API_BASE_URL } from "../constants";
import { getCart, removeCartItem, updateCartQuantity } from "../utils/cart";
import {
  createCheckoutSession,
  createDirectOrder,
  createOrder,
  confirmCheckout,
} from "../utils/order";























const deliveryMethods = [



  { id: 1, title: "Standard", turnaround: "4–10 business days", price: 5 },
  { id: 2, title: "Express", turnaround: "2–5 business days", price: 16 },
];

const paymentMethods = [
  {
    id: "stripe",
    title: "Pay online",
    description: "Secure card payment via Stripe",
    icon: CreditCardIcon,
  },
  {
    id: "cod",
    title: "Cash on Delivery",
    description: "Pay in cash when your order arrives",
    icon: BanknotesIcon,
  },
];

const TAX_RATE = 0.0863;

// Map an address type to a friendly chip label
const chipLabel = (type) =>
  type === "home" ? "Home" : type === "work" ? "Work" : "Other";

// The store charges in rupees (Stripe is configured with "inr"), so keep
// every checkout total consistent with the rest of the storefront.
const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const primaryButton =
  "inline-flex items-center justify-center rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2";

const secondaryButton =
  "inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2";

// Shown while the server verifies the Stripe session and creates the order.
// It replaces the checkout form so the shopper never sees it again after a
// successful payment.
const PaymentVerifying = () => (
  <div className="bg-gray-50">
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
      <div
        className="size-12 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"
        aria-hidden="true"
      />
      <h1 className="mt-6 text-xl font-semibold text-gray-900">
        Confirming your payment…
      </h1>
      <p className="mt-2 max-w-sm text-sm text-gray-600">
        Please keep this page open while we finish placing your order.
      </p>
    </div>
  </div>
);

// Dedicated payment-success page. Uses the order returned by the server (not
// the cart, which may already be cleared) so the receipt stays complete even
// after a full-page redirect back from Stripe.
const PaymentSuccess = ({
  order,
  onViewOrders,
  onContinueShopping,
  onContactSupport,
}) => {
  const items = order?.items || [];

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="px-6 py-10 text-center sm:px-10">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100 text-green-600 ring-8 ring-green-50">
              <CheckCircleIcon className="size-9" aria-hidden="true" />
            </span>
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Payment successful
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Thank you! Your order has been placed and a confirmation email is
              on its way to{" "}
              <span className="font-medium text-gray-900">
                {order?.contactEmail}
              </span>
              .
            </p>
            {order?.orderNumber && (
              <p className="mt-4 inline-flex rounded-full bg-gray-100 px-4 py-1.5 text-sm font-semibold tracking-wide text-gray-800">
                Order {order.orderNumber}
              </p>
            )}
          </div>

          <dl className="grid grid-cols-1 gap-px border-t border-gray-200 bg-gray-200 sm:grid-cols-3">
            <div className="bg-white px-6 py-4 text-center">
              <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                Amount paid
              </dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {money(order?.total)}
              </dd>
            </div>
            <div className="bg-white px-6 py-4 text-center">
              <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                Payment method
              </dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {order?.paymentMethod === "cod" ? "Cash on delivery" : "Card"}
              </dd>
            </div>
            <div className="bg-white px-6 py-4 text-center">
              <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                Payment status
              </dt>
              <dd className="mt-1 text-lg font-semibold text-green-700 capitalize">
                {order?.paymentStatus || "paid"}
              </dd>
            </div>
          </dl>

          <div className="border-t border-gray-200 px-6 py-6 sm:px-10">
            <h2 className="text-sm font-semibold text-gray-900">
              Items in this order
            </h2>
            <ul role="list" className="mt-3 divide-y divide-gray-100">
              {items.map((item, index) => (
                <li
                  key={`${item.title}-${index}`}
                  className="flex items-center gap-4 py-3"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="size-16 shrink-0 rounded-md border border-gray-200 object-cover"
                    />
                  ) : (
                    <div
                      className="size-16 shrink-0 rounded-md border border-dashed border-gray-200 bg-gray-50"
                      aria-hidden="true"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {[item.color, item.size].filter(Boolean).join(" · ")}
                      {item.quantity > 1 ? ` · Qty ${item.quantity}` : ""}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {money(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-gray-200 px-6 py-6 sm:px-10">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Subtotal</dt>
                <dd className="font-medium text-gray-900">
                  {money(order?.subtotal)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Shipping</dt>
                <dd className="font-medium text-gray-900">
                  {money(order?.shipping)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Taxes</dt>
                <dd className="font-medium text-gray-900">
                  {money(order?.taxes)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-base">
                <dt className="font-semibold text-gray-900">Total paid</dt>
                <dd className="font-semibold text-gray-900">
                  {money(order?.total)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-6 sm:flex-row sm:justify-center sm:px-10">
            <button type="button" onClick={onViewOrders} className={primaryButton}>
              View my orders
            </button>
            <button
              type="button"
              onClick={onContinueShopping}
              className={secondaryButton}
            >
              Continue shopping
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Need help with this order?{" "}
          <button
            type="button"
            onClick={onContactSupport}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Contact support
          </button>
        </p>
      </div>
    </div>
  );
};

// Shown when the return trip from Stripe cannot be verified. Never falls back
// to the checkout form — the shopper may already have been charged.
const PaymentError = ({
  message,
  sessionId,
  onRetry,
  onViewOrders,
  onContactSupport,
}) => (
  <div className="bg-gray-50">
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 ring-8 ring-amber-50">
          <ExclamationTriangleIcon className="size-7" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">
          We couldn&apos;t confirm your order
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">{message}</p>
        <p className="mt-2 text-xs leading-5 text-gray-500">
          If your payment went through, your card was charged safely — contact
          support with the reference below and we&apos;ll help you finish the
          order.
        </p>
        {sessionId && (
          <p className="mt-4 rounded-md bg-gray-50 px-3 py-2 font-mono text-xs break-all text-gray-600">
            Payment reference: {sessionId}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {onRetry && (
            <button type="button" onClick={onRetry} className={primaryButton}>
              Try again
            </button>
          )}
          <button
            type="button"
            onClick={onViewOrders}
            className={onRetry ? secondaryButton : primaryButton}
          >
            View my orders
          </button>
        </div>
        <button
          type="button"
          onClick={onContactSupport}
          className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Contact support
        </button>
      </div>
    </div>
  </div>
);

const Checkout = () => {
  const { isSignedIn, isLoaded, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // "Buy now" passes a single item via route state. When present, checkout
  // operates on that item only and never touches the user's cart.
  const buyNow = location.state?.buyNow || null;

  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Result of returning from Stripe's hosted checkout.
  // status: "idle" | "verifying" | "success" | "canceled" | "error"
  // Start in "verifying" when the URL says a payment succeeded, so the
  // checkout form never flashes before the server confirms the order.
  const [paymentResult, setPaymentResult] = useState(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("success")) {
      return { status: "verifying", message: "Confirming your payment…" };
    }
    if (params.get("canceled")) {
      return {
        status: "canceled",
        message:
          "Payment canceled — you can continue shopping and check out when you're ready.",
      };
    }
    return { status: "idle", message: "" };
  });
  // Bumping this re-runs the confirmation request ("Try again").
  const [verifyAttempt, setVerifyAttempt] = useState(0);

  const [deliveryMethodId, setDeliveryMethodId] = useState(
    deliveryMethods[0].id,
  );
  const [paymentMethod, setPaymentMethod] = useState("stripe");

  // Shipping / contact form — controlled so address chips can populate it.
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    company: "",
    address: "",
    apartment: "",
    city: "",
    country: "",
    region: "",
    postalCode: "",
    phone: "",
  });

  const cartItems = (cart?.items || []).filter((item) => item.product?._id);

  // Lines to display + order. In "buy now" mode this is the single item the
  // user chose; otherwise it's the regular cart.
  const orderItems = buyNow
    ? [
        {
          product: {
            _id: buyNow.productId,
            title: buyNow.title,
            price: buyNow.price,
            images: buyNow.image ? [buyNow.image] : [],
            variants: [],
          },
          productId: buyNow.productId,
          color: buyNow.color,
          size: buyNow.size,
          quantity: buyNow.quantity || 1,
        },
      ]
    : cartItems;

  // Prefill the signed-in user's email (email is required to place an order)
  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      setForm((prev) => ({
        ...prev,
        email: prev.email || user.primaryEmailAddress.emailAddress,
      }));
    }
  }, [user]);

  // Load cart + saved addresses once the user is available
  useEffect(() => {
    if (!isSignedIn || !user?.id) {
      if (isLoaded) setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      const [cartData, addressData] = await Promise.all([
        getCart(user.id),
        fetch(`${API_BASE_URL}/api/address/getalladdress`)
          .then((res) => res.json())
          .then((json) => (json.data || []).filter((a) => a.clerkId === user.id))
          .catch(() => []),
      ]);
      setCart(cartData);
      setAddresses(addressData);
      setLoading(false);
    };

    load();
  }, [isSignedIn, isLoaded, user?.id]);

  // Handle the redirect back from Stripe's hosted checkout.
  //  • ?success=true&session_id=... → verify payment server-side, create the
  //    order, and replace the checkout form with the success page.
  //  • ?canceled=true              → let them know nothing was charged.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cancelled = params.get("canceled");
    const success = params.get("success");
    const sessionId = params.get("session_id");

    if (cancelled) {
      setPaymentResult({
        status: "canceled",
        message:
          "Payment canceled — you can continue shopping and check out when you're ready.",
      });
      return;
    }

    if (success) {
      if (!sessionId) {
        setPaymentResult({
          status: "error",
          message:
            "We couldn't find your payment reference. If you were charged, contact support.",
        });
        return;
      }
      let active = true;
      const verify = async () => {
        setPaymentResult({ status: "verifying", message: "Confirming your payment…" });
        try {
          const order = await confirmCheckout(sessionId);
          if (!active) return;
          setPaymentResult({
            status: "success",
            message: `Order placed! Your order number is ${order.orderNumber}. A confirmation email is on its way.`,
            order,
          });
          // Cart-based orders clear the cart server-side.
          window.dispatchEvent(new Event("cart-updated"));
        } catch (err) {
          if (!active) return;
          setPaymentResult({
            status: "error",
            message: err.message || "We could not confirm your payment.",
          });
        }
      };
      verify();
      return () => {
        active = false;
      };
    }
  }, [location.search, verifyAttempt]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Populate the shipping form from a saved address chip
  const applyAddress = (address) => {
    const [firstName, ...rest] = (address.fullName || "").trim().split(" ");
    setSelectedAddressId(address._id);
    setForm((prev) => ({
      ...prev,
      firstName: firstName || "",
      lastName: rest.join(" "),
      address: address.addressLine1 || "",
      apartment: address.addressLine2 || "",
      city: address.city || "",
      region: address.state || "",
      postalCode: address.pincode || "",
      country: address.country || "",
      phone: address.phone || "",
    }));
  };

  // Editing any shipping field manually detaches the selected chip
  const clearSelectedAddress = () => setSelectedAddressId(null);

  const handleQuantityChange = async (item, quantity) => {
    try {
      const updated = await updateCartQuantity(user.id, item, quantity);
      if (updated) setCart(updated);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemoveItem = async (item) => {
    try {
      const updated = await removeCartItem(user.id, item);
      if (updated) setCart(updated);
      toast.success("Item removed from cart");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const selectedDelivery = useMemo(
    () =>
      deliveryMethods.find((m) => m.id === deliveryMethodId) ||
      deliveryMethods[0],
    [deliveryMethodId],
  );

  const subtotal =
    buyNow
      ? buyNow.price * (buyNow.quantity || 1)
      : cart?.subtotal || 0;
  const shipping = orderItems.length ? selectedDelivery.price : 0;
  const taxes = subtotal * TAX_RATE;
  const total = subtotal + shipping + taxes;

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEmailValid) {
      toast.error("Please enter a valid email address to place your order.");
      return;
    }
    if (!form.phone.trim()) {
      toast.error(
        "Please enter a phone number — the courier needs it to deliver your order.",
      );
      return;
    }
    if (buyNow) {
      if (!orderItems.length) {
        toast.error("No item to order.");
        return;
      }
    } else if (!cartItems.length) {
      toast.error("Your cart is empty.");
      return;
    }

    // Build the shipping address snapshot from the form fields
    const shippingAddress = {
      fullName: `${form.firstName} ${form.lastName}`.trim(),
      phone: form.phone,
      addressLine1: form.address,
      addressLine2: form.apartment,
      country: form.country,
      state: form.region,
      district: form.city,
      city: form.city,
      pincode: form.postalCode,
      landmark: form.company,
      addressType:
        addresses.find((a) => a._id === selectedAddressId)?.addressType ||
        "home",
    };

    // Shared payload for both payment paths. Buy-now sends explicit items;
    // cart checkout lets the backend read the user's cart.
    const payload = {
      userId: user.id,
      contactEmail: form.email,
      shippingAddress,
      deliveryMethod: selectedDelivery.title,
      shipping,
      ...(buyNow
        ? {
            items: [
              {
                productId: buyNow.productId,
                color: buyNow.color,
                size: buyNow.size,
                quantity: buyNow.quantity || 1,
              },
            ],
          }
        : {}),
    };

    setPlacingOrder(true);
    try {
      if (paymentMethod === "cod") {
        // Cash on Delivery: place the order immediately. The backend reserves
        // stock, leaves payment pending, and records that cash is due.
        const order = buyNow
          ? await createDirectOrder({ ...payload, paymentMethod: "cod" })
          : await createOrder({ ...payload, paymentMethod: "cod" });
        toast.success(
          `Order ${order.orderNumber} placed — pay ${money(
            order.total,
          )} in cash on delivery.`,
        );
        navigate("/orders", { replace: true });
        return;
      }

      // Start a Stripe Checkout Session for this order, then hand the shopper
      // off to Stripe's hosted payment page. The order itself is created by
      // the backend once payment succeeds (on the ?success return trip).
      const { url } = await createCheckoutSession(payload);
      if (!url) {
        throw new Error("Could not start checkout. Please try again.");
      }
      // Full-page redirect to Stripe. We come back to /checkout?success=...
      window.location.href = url;
    } catch (err) {
      toast.error(err.message || "Could not start checkout");
      setPlacingOrder(false);
    }
  };

  // Payment return states render before the auth/loading guards. The shopper
  // has already paid and been redirected, so Clerk still resolving must not
  // hide the receipt or flash the checkout form.
  if (paymentResult.status === "verifying") {
    return <PaymentVerifying />;
  }

  if (paymentResult.status === "success") {
    return (
      <PaymentSuccess
        order={paymentResult.order}
        onViewOrders={() => navigate("/orders")}
        onContinueShopping={() => navigate("/shop")}
        onContactSupport={() => navigate("/contact")}
      />
    );
  }

  if (paymentResult.status === "error") {
    const returnSessionId = new URLSearchParams(location.search).get(
      "session_id",
    );
    return (
      <PaymentError
        message={paymentResult.message}
        sessionId={returnSessionId}
        onRetry={
          returnSessionId
            ? () => {
                setPaymentResult({
                  status: "verifying",
                  message: "Confirming your payment…",
                });
                setVerifyAttempt((attempt) => attempt + 1);
              }
            : null
        }
        onViewOrders={() => navigate("/orders")}
        onContactSupport={() => navigate("/contact")}
      />
    );
  }

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500">
            Please sign in to proceed to checkout.
          </p>
        </div>
      </div>
    );
  }

  return (

    <div className="bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 pt-16 pb-24 sm:px-6 lg:max-w-7xl lg:px-8">
        <h2 className="sr-only">Checkout</h2>

        {/* The success, verifying, and error returns render full pages above,
            so only a canceled payment still lands on the form. */}
        {paymentResult.status === "canceled" && (
          <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p>{paymentResult.message}</p>
          </div>
        )}


        <form
          onSubmit={handleSubmit}
          className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16"
        >
          <div>
            <div>

              <h2 className="text-lg font-medium text-gray-900">
                Contact information
              </h2>

              <div className="mt-4">


                <label
                  htmlFor="email-address"
                  className="block text-sm/6 font-medium text-gray-700"
                >
                  Email address <span className="text-red-500">*</span>
                </label>
                <div className="mt-2">
                  <input
                    id="email-address"

                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Your order confirmation and shipping updates will be sent
                  here.
                </p>
              </div>
            </div>

            <div className="mt-10 border-t border-gray-200 pt-10">

              <h2 className="text-lg font-medium text-gray-900">
                Shipping information
              </h2>


              {/* Saved address chips */}
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Choose a saved address
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate("/savedaddresses")}
                    className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    <PlusIcon aria-hidden="true" className="size-3.5" />
                    Add new
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">
                    No saved addresses yet.{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/savedaddresses")}
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Add one
                    </button>{" "}
                    or fill in the form below.
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {addresses.map((address) => {
                      const isActive = selectedAddressId === address._id;
                      return (
                        <button
                          key={address._id}
                          type="button"
                          onClick={() => applyAddress(address)}
                          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition focus:outline-none ${
                            isActive
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-gray-300 bg-white text-gray-700 hover:border-indigo-400 hover:text-indigo-600"
                          }`}
                        >
                          <MapPinIcon aria-hidden="true" className="size-4" />
                          <span className="capitalize">
                            {chipLabel(address.addressType)}
                          </span>
                          <span
                            className={
                              isActive ? "text-indigo-100" : "text-gray-400"
                            }
                          >
                            · {address.city}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                <div>

                  <label
                    htmlFor="first-name"
                    className="block text-sm/6 font-medium text-gray-700"
                  >
                    First name
                  </label>
                  <div className="mt-2">
                    <input
                      id="first-name"

                      name="firstName"
                      type="text"
                      required
                      value={form.firstName}
                      onChange={(e) => {
                        handleChange(e);
                        clearSelectedAddress();
                      }}
                      autoComplete="given-name"
                      className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    />
                  </div>
                </div>

                <div>

                  <label
                    htmlFor="last-name"
                    className="block text-sm/6 font-medium text-gray-700"
                  >
                    Last name
                  </label>
                  <div className="mt-2">
                    <input
                      id="last-name"

                      name="lastName"
                      type="text"
                      value={form.lastName}
                      onChange={(e) => {
                        handleChange(e);
                        clearSelectedAddress();
                      }}
                      autoComplete="family-name"
                      className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">

                  <label
                    htmlFor="company"
                    className="block text-sm/6 font-medium text-gray-700"
                  >
                    Company
                  </label>
                  <div className="mt-2">
                    <input
                      id="company"
                      name="company"
                      type="text"
                      value={form.company}
                      onChange={handleChange}
                      className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">

                  <label
                    htmlFor="address"
                    className="block text-sm/6 font-medium text-gray-700"
                  >
                    Address
                  </label>
                  <div className="mt-2">
                    <input
                      id="address"
                      name="address"
                      type="text"
                      required
                      value={form.address}
                      onChange={(e) => {
                        handleChange(e);
                        clearSelectedAddress();
                      }}
                      autoComplete="street-address"
                      className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">

                  <label
                    htmlFor="apartment"
                    className="block text-sm/6 font-medium text-gray-700"
                  >
                    Apartment, suite, etc.
                  </label>
                  <div className="mt-2">
                    <input
                      id="apartment"
                      name="apartment"
                      type="text"
                      value={form.apartment}
                      onChange={(e) => {
                        handleChange(e);
                        clearSelectedAddress();
                      }}
                      className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    />
                  </div>
                </div>

                <div>

                  <label
                    htmlFor="city"
                    className="block text-sm/6 font-medium text-gray-700"
                  >
                    City
                  </label>
                  <div className="mt-2">
                    <input
                      id="city"
                      name="city"
                      type="text"
                      required
                      value={form.city}
                      onChange={(e) => {
                        handleChange(e);
                        clearSelectedAddress();
                      }}
                      autoComplete="address-level2"
                      className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    />
                  </div>
                </div>

                <div>

                  <label
                    htmlFor="country"
                    className="block text-sm/6 font-medium text-gray-700"
                  >
                    Country
                  </label>
                  <div className="mt-2 grid grid-cols-1">
                    <select
                      id="country"
                      name="country"
                      value={form.country}
                      onChange={(e) => {
                        handleChange(e);
                        clearSelectedAddress();
                      }}
                      autoComplete="country-name"
                      className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    >
                      <option value="">Select a country</option>
                      <option>United States</option>
                      <option>Canada</option>
                      <option>Mexico</option>
                      <option>India</option>
                    </select>
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                    />
                  </div>
                </div>

                <div>

                  <label
                    htmlFor="region"
                    className="block text-sm/6 font-medium text-gray-700"
                  >
                    State / Province
                  </label>
                  <div className="mt-2">
                    <input
                      id="region"
                      name="region"
                      type="text"
                      required
                      value={form.region}
                      onChange={(e) => {
                        handleChange(e);
                        clearSelectedAddress();
                      }}
                      autoComplete="address-level1"
                      className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    />
                  </div>
                </div>

                <div>

                  <label
                    htmlFor="postal-code"
                    className="block text-sm/6 font-medium text-gray-700"
                  >
                    Postal code
                  </label>
                  <div className="mt-2">
                    <input
                      id="postal-code"

                      name="postalCode"
                      type="text"
                      required
                      value={form.postalCode}
                      onChange={(e) => {
                        handleChange(e);
                        clearSelectedAddress();
                      }}
                      autoComplete="postal-code"
                      className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">

                  <label
                    htmlFor="phone"
                    className="block text-sm/6 font-medium text-gray-700"
                  >
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2">
                    <input
                      id="phone"
                      name="phone"
                      type="text"
                      required
                      value={form.phone}
                      onChange={(e) => {
                        handleChange(e);
                        clearSelectedAddress();
                      }}
                      autoComplete="tel"
                      className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 border-t border-gray-200 pt-10">
              <fieldset>

                <legend className="text-lg font-medium text-gray-900">
                  Delivery method
                </legend>
                <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                  {deliveryMethods.map((deliveryMethod) => (
                    <label
                      key={deliveryMethod.id}
                      aria-label={deliveryMethod.title}

                      aria-description={`${deliveryMethod.turnaround} for ${money(deliveryMethod.price)}`}
                      className="group relative flex rounded-lg border border-gray-300 bg-white p-4 has-checked:outline-2 has-checked:-outline-offset-2 has-checked:outline-indigo-600 has-focus-visible:outline-3 has-focus-visible:-outline-offset-1 has-disabled:border-gray-400 has-disabled:bg-gray-200 has-disabled:opacity-25"
                    >
                      <input


                        value={deliveryMethod.id}
                        checked={deliveryMethodId === deliveryMethod.id}
                        onChange={() => setDeliveryMethodId(deliveryMethod.id)}
                        name="delivery-method"
                        type="radio"
                        className="absolute inset-0 appearance-none focus:outline-none"
                      />
                      <div className="flex-1">



                        <span className="block text-sm font-medium text-gray-900">
                          {deliveryMethod.title}
                        </span>
                        <span className="mt-1 block text-sm text-gray-500">
                          {deliveryMethod.turnaround}
                        </span>
                        <span className="mt-6 block text-sm font-medium text-gray-900">
                          {money(deliveryMethod.price)}
                        </span>
                      </div>
                      <CheckCircleIcon
                        aria-hidden="true"
                        className="invisible size-5 text-indigo-600 group-has-checked:visible"
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className="mt-10 border-t border-gray-200 pt-10">
              <fieldset>
                <legend className="text-lg font-medium text-gray-900">
                  Payment method
                </legend>
                <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <label
                        key={method.id}
                        className="group relative flex rounded-lg border border-gray-300 bg-white p-4 has-checked:outline-2 has-checked:-outline-offset-2 has-checked:outline-indigo-600 has-focus-visible:outline-3 has-focus-visible:-outline-offset-1"
                      >
                        <input
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={() => setPaymentMethod(method.id)}
                          name="payment-method"
                          type="radio"
                          className="absolute inset-0 appearance-none focus:outline-none"
                        />
                        <div className="flex-1">
                          <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                            <Icon
                              aria-hidden="true"
                              className="size-5 text-gray-500"
                            />
                            {method.title}
                          </span>
                          <span className="mt-1 block text-sm text-gray-500">
                            {method.description}
                          </span>
                        </div>
                        <CheckCircleIcon
                          aria-hidden="true"
                          className="invisible size-5 text-indigo-600 group-has-checked:visible"
                        />
                      </label>
                    );
                  })}
                </div>
                {paymentMethod === "cod" && (
                  <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Please keep {money(total)} ready in cash when your order
                    arrives. We'll call your phone number before delivery.
                  </p>
                )}
              </fieldset>
            </div>
          </div>

          {/* Order summary */}
          <div className="mt-10 lg:mt-0">
            <h2 className="text-lg font-medium text-gray-900">Order summary</h2>

            <div className="mt-4 rounded-lg border border-gray-200 bg-white shadow-xs">
              <h3 className="sr-only">Items in your cart</h3>

















              {loading && !buyNow ? (
                <p className="px-4 py-10 text-sm text-gray-500 sm:px-6">
                  Loading your cart...
                </p>
              ) : orderItems.length === 0 ? (
                <p className="px-4 py-10 text-sm text-gray-500 sm:px-6">
                  Your cart is empty. Add some products before checking out.
                </p>
              ) : (
                <ul role="list" className="divide-y divide-gray-200">
                  {orderItems.map((item) => {
                    const product = item.product;
                    const lineId = `${product._id}-${item.color}-${item.size}`;
                    const maxStock =
                      (product.variants || []).find(
                        (v) => v.color === item.color && v.size === item.size,
                      )?.stock ?? 10;
                    return (
                      <li key={lineId} className="flex px-4 py-6 sm:px-6">
                        <div className="shrink-0">
                          {product.images?.[0] && (
                            <img
                              alt={product.title}
                              src={product.images[0]}
                              className="w-20 rounded-md"
                            />
                          )}
                        </div>











                        <div className="ml-6 flex flex-1 flex-col">
                          <div className="flex">
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm">
                                <a
                                  href={`/product/${product._id}`}
                                  className="font-medium text-gray-700 hover:text-gray-800"
                                >
                                  {product.title}
                                </a>
                              </h4>
                              <p className="mt-1 text-sm text-gray-500">
                                {item.color}
                              </p>
                              <p className="mt-1 text-sm text-gray-500">
                                {item.size}
                              </p>
                            </div>



                            <div className="ml-4 flow-root shrink-0">
                              {!buyNow && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item)}
                                  className="-m-2.5 flex items-center justify-center bg-white p-2.5 text-gray-400 hover:text-gray-500"
                                >
                                  <span className="sr-only">Remove</span>
                                  <TrashIcon
                                    aria-hidden="true"
                                    className="size-5"
                                  />
                                </button>
                              )}
                            </div>
                          </div>






















                          <div className="flex flex-1 items-end justify-between pt-2">
                            <p className="mt-1 text-sm font-medium text-gray-900">
                              {money(product.price * item.quantity)}
                            </p>

                            <div className="ml-4">
                              {buyNow ? (
                                <p className="text-sm text-gray-500">
                                  Qty {item.quantity}
                                </p>
                              ) : (
                                <div className="grid grid-cols-1">
                                  <select
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleQuantityChange(
                                        item,
                                        Number(e.target.value),
                                      )
                                    }
                                    aria-label="Quantity"
                                    className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                                  >
                                    {Array.from(
                                      { length: Math.max(maxStock, 1) },
                                      (_, i) => i + 1,
                                    ).map((n) => (
                                      <option key={n} value={n}>
                                        {n}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDownIcon
                                    aria-hidden="true"
                                    className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>





                      </li>
                    );
                  })}
                </ul>
              )}

              <dl className="space-y-6 border-t border-gray-200 px-4 py-6 sm:px-6">
                <div className="flex items-center justify-between">
                  <dt className="text-sm">Subtotal</dt>

                  <dd className="text-sm font-medium text-gray-900">
                    {money(subtotal)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm">Shipping</dt>

                  <dd className="text-sm font-medium text-gray-900">
                    {money(shipping)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm">Taxes</dt>

                  <dd className="text-sm font-medium text-gray-900">
                    {money(taxes)}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                  <dt className="text-base font-medium">Total</dt>

                  <dd className="text-base font-medium text-gray-900">
                    {money(total)}
                  </dd>
                </div>
              </dl>

              <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                <button
                  type="submit"

                  disabled={placingOrder || !isEmailValid || !orderItems.length}
                  className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-xs hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {placingOrder
                    ? "Placing order..."
                    : paymentMethod === "cod"
                      ? "Place order — pay on delivery"
                      : "Continue to payment"}
                </button>
                {!isEmailValid && (
                  <p className="mt-2 text-center text-xs text-gray-500">
                    Enter a valid email to place your order.
                  </p>
                )}
                {isEmailValid && !placingOrder && (
                  <p className="mt-2 text-center text-xs text-gray-500">
                    {paymentMethod === "cod"
                      ? `No payment is taken now — pay ${money(total)} in cash when your order arrives.`
                      : "You'll be redirected to Stripe to complete payment securely."}
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>



  );
};


export default Checkout;
