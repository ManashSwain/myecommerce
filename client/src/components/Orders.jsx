import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import useAuth from "../customhooks/useAuth";
import BackToHome from "./BackToHome";
import { OrdersSkeleton } from "./Loader";
import {
  getOrders,
  cancelOrder,
  requestReplacement,
  requestReturn,
} from "../utils/order";
import { downloadInvoice } from "../utils/invoice";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import {
  ExclamationTriangleIcon,
  ArrowsRightLeftIcon,
  ArrowDownTrayIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

// Ordered tracking steps — index matches the statusStep() value below.
const STEPS = ["Order placed", "Processing", "Shipped", "Delivered"];

// Orders that have left the linear placed→delivered track hide the progress
// bar and show a notice instead.
const CANCELLED_STATUSES = ["return_in_transit", "cancelled", "refunded"];

// Post-delivery return / refund flow.
const RETURN_FLOW_STATUSES = [
  "return_requested",
  "return_in_transit",
  "return_received",
  "returned",
];

// Replacement (exchange) flow — no money changes hands.
const REPLACEMENT_ACTIVE_STATUSES = [
  "replacement_requested",
  "replacement_out",
  "replacement_completed",
];
// Whether the customer can start a replacement (delivered, and not already
// in a replacement flow).
const canRequestReplacement = (order) =>
  order.status === "delivered";

// Returns are only possible after delivery. A rejected request puts the order
// back into delivered, so it can be raised again.
const canRequestReturn = (order) => order.status === "delivered";

// Estimate the refund for the selected quantities, mirroring the server:
// a full return includes shipping; a partial return includes the returned
// line totals plus their proportional share of tax.
const estimateReturnRefund = (order, selections) => {
  if (!order) return 0;
  const selected = new Map();
  order.items.forEach((item, index) => {
    const quantity = selections[index] || 0;
    if (quantity < 1) return;
    const key = `${item.product}|${item.color}|${item.size}`;
    const existing = selected.get(key);
    if (existing) existing.quantity += quantity;
    else selected.set(key, { ...item, quantity });
  });
  if (selected.size === 0) return 0;

  const ordered = new Map();
  order.items.forEach((item) => {
    const key = `${item.product}|${item.color}|${item.size}`;
    ordered.set(key, (ordered.get(key) || 0) + item.quantity);
  });

  const isFullReturn =
    selected.size === ordered.size &&
    [...ordered].every(
      ([key, quantity]) => selected.get(key)?.quantity === quantity
    );
  if (isFullReturn) return order.total;

  const itemsSubtotal = [...selected.values()].reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const taxShare =
    order.subtotal > 0 ? order.taxes * (itemsSubtotal / order.subtotal) : 0;
  return Math.min(order.total, itemsSubtotal + taxShare);
};

const returnAmount = (order) =>
  formatCurrency(order.return?.refundAmount ?? order.total);

// Map an order status to the progress bar step (0-3)
const statusStep = (status) => {
  switch (status) {
    case "processing":
      return 1;
    case "shipped":
      return 2;
    case "delivered":
      return 3;
    default:
      return 0; // placed
  }
};

const STATUS_LABELS = {
  return_requested: "Return requested",
  return_in_transit: "Returning to us",
  return_received: "Return received",
  returned: "Return completed",
  replacement_requested: "Replacement requested",
  replacement_out: "Replacement on its way",
  replacement_completed: "Replacement completed",
};
const statusLabel = (status) => {
  if (!status) return "Placed";
  if (STATUS_LABELS[status]) return STATUS_LABELS[status];
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// A customer may cancel while the order is still placed/processing.
const canCancel = (status) => status === "placed" || status === "processing";

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

// Payment method / status helpers. Orders created before COD existed have no
// paymentMethod and are treated as card orders.
const isCodOrder = (order) =>
  order.paymentMethod === "cod" || order.payment?.provider === "cod";
const paymentMethodLabel = (order) =>
  isCodOrder(order) ? "Cash on Delivery" : "Card (Stripe)";
const PAYMENT_STATUS_LABELS = {
  pending: "Payment pending",
  paid: "Paid",
  refund_pending: "Refund pending",
  refunded: "Refunded",
};
const paymentStatusLabel = (order) => {
  const status = order.paymentStatus || "pending";
  if (isCodOrder(order)) {
    if (status === "pending") {
      if (
        [
          "cancelled",
          "return_requested",
          "return_in_transit",
          "return_received",
          "returned",
        ].includes(order.status)
      ) {
        return "No payment collected";
      }
      if (order.status === "delivered") return "Cash not collected";
      return "Pay on delivery";
    }
    if (status === "paid") return "Cash collected";
  }
  return PAYMENT_STATUS_LABELS[status] || status;
};

const Orders = () => {
  const { isSignedIn, isLoaded, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cancellation dialog state
  const [cancelTarget, setCancelTarget] = useState(null);
  const [reason, setReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Replacement dialog state
  const [replaceTarget, setReplaceTarget] = useState(null);
  const [replaceReason, setReplaceReason] = useState("");
  const [replacing, setReplacing] = useState(false);

  // Return dialog state. Selections maps an order item index to the quantity
  // the customer wants to send back (0 means not selected).
  const [returnTarget, setReturnTarget] = useState(null);
  const [returnSelections, setReturnSelections] = useState({});
  const [returnReason, setReturnReason] = useState("");
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    if (!isSignedIn || !user?.id) {
      if (isLoaded) setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      const data = await getOrders(user.id);
      setOrders(data);
      setLoading(false);
    };
    load();
  }, [isSignedIn, isLoaded, user?.id]);

  const openCancel = (order) => {
    setCancelTarget(order);
    setReason("");
  };

  const closeCancel = () => {
    if (cancelling) return;
    setCancelTarget(null);
    setReason("");
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const updated = await cancelOrder(cancelTarget._id, user.id, reason);
      // Replace the order in-place so the UI updates without a full reload.
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o)),
      );
      toast.success(
        updated.cancellation?.refundStatus === "not_required"
          ? "Order cancelled. No payment was collected, so no refund is needed."
          : "Order cancelled. Your refund is being processed.",
      );
      setCancelTarget(null);
      setReason("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const openReplace = (order) => {
    setReplaceTarget(order);
    setReplaceReason("");
  };

  const closeReplace = () => {
    if (replacing) return;
    setReplaceTarget(null);
    setReplaceReason("");
  };

  const confirmReplace = async () => {
    if (!replaceTarget) return;
    setReplacing(true);
    try {
      const updated = await requestReplacement(
        replaceTarget._id,
        user.id,
        replaceReason,
      );
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o)),
      );
      toast.success(
        "Replacement requested. We'll arrange pickup of your item.",
      );
      setReplaceTarget(null);
      setReplaceReason("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setReplacing(false);
    }
  };

  const openReturn = (order) => {
    setReturnTarget(order);
    const initial = {};
    order.items.forEach((item, index) => {
      initial[index] = item.quantity;
    });
    setReturnSelections(initial);
    setReturnReason("");
  };

  const closeReturn = () => {
    if (returning) return;
    setReturnTarget(null);
    setReturnSelections({});
    setReturnReason("");
  };

  const toggleReturnItem = (index, checked, maxQuantity) => {
    setReturnSelections((prev) => ({
      ...prev,
      [index]: checked ? maxQuantity : 0,
    }));
  };

  const changeReturnQuantity = (index, quantity) => {
    setReturnSelections((prev) => ({
      ...prev,
      [index]: Number(quantity),
    }));
  };

  const confirmReturn = async () => {
    if (!returnTarget) return;
    if (!returnReason.trim()) {
      toast.error("Tell us why you're returning these items.");
      return;
    }
    const items = returnTarget.items
      .map((item, index) => ({
        product: item.product,
        color: item.color,
        size: item.size,
        quantity: returnSelections[index] || 0,
      }))
      .filter((item) => item.quantity > 0);
    if (items.length === 0) {
      toast.error("Select at least one item to return.");
      return;
    }

    setReturning(true);
    try {
      const updated = await requestReturn(returnTarget._id, user.id, {
        reason: returnReason,
        items,
      });
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o)),
      );
      toast.success(
        "Return requested. We'll review it and arrange pickup once approved.",
      );
      setReturnTarget(null);
      setReturnSelections({});
      setReturnReason("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setReturning(false);
    }
  };

  const returnItemCount = Object.values(returnSelections).reduce(
    (sum, quantity) => sum + (quantity > 0 ? quantity : 0),
    0,
  );
  const estimatedRefund = estimateReturnRefund(
    returnTarget,
    returnSelections,
  );
  const returnPaymentPending =
    returnTarget &&
    isCodOrder(returnTarget) &&
    (returnTarget.paymentStatus || "pending") === "pending";

  // Generate and download the order's invoice as a PDF. Purely client-side —
  // the PDF is built from the order data already on screen (no DB writes).
  const handleDownloadInvoice = (order) => {
    try {
      downloadInvoice(order);
      toast.success("Invoice downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Could not generate the invoice");
    }
  };

  // Auth still resolving — show a matching skeleton instead of a blank page.
  if (!isLoaded) {
    return (
      <div className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <BackToHome />
        </div>
        <div className="mx-auto max-w-2xl px-4 pt-6 pb-16 sm:px-6 sm:pb-24 lg:max-w-7xl lg:px-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Your orders
          </h1>
          <OrdersSkeleton />
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500">
            Please sign in to view your orders.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <BackToHome />
      </div>
      <div className="mx-auto max-w-2xl px-4 pt-6 pb-16 sm:px-6 sm:pb-24 lg:max-w-7xl lg:px-8">
        <div className="space-y-2 px-4 sm:flex sm:items-baseline sm:justify-between sm:space-y-0 sm:px-0">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Your orders
          </h1>
        </div>

        {loading ? (
          <OrdersSkeleton />
        ) : orders.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-24 text-center">
            <p className="text-sm text-gray-500">
              You haven't placed any orders yet.
            </p>
            <Link
              to="/shop"
              className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Start shopping &rarr;
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {orders.map((order) => {
              const step = statusStep(order.status);
              const isCancelled = CANCELLED_STATUSES.includes(order.status);
              const isReplacement = REPLACEMENT_ACTIVE_STATUSES.includes(
                order.status,
              );
              // A return is distinguishable from a shipped-order cancellation
              // because only returns carry `order.return.requestedAt`.
              const isReturnFlow =
                Boolean(order.return?.requestedAt) &&
                (RETURN_FLOW_STATUSES.includes(order.status) ||
                  (order.status === "refunded" &&
                    Boolean(order.return?.refundedAt)));
              // Any non-linear state hides the delivery tracker.
              const hideTracker =
                isCancelled ||
                isReplacement ||
                isReturnFlow ||
                ["return_requested", "return_received", "returned"].includes(
                  order.status,
                );
              // Unpaid COD cancellations have no money to return.
              const refundNotRequired =
                order.cancellation?.refundStatus === "not_required";
              return (
                <div
                  key={order._id}
                  className="border-t border-b border-gray-200 bg-white shadow-xs sm:rounded-lg sm:border"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-200 px-4 py-4 sm:px-6">
                    <div>
                      <h2 className="text-base font-medium text-gray-900">
                        Order {order.orderNumber}
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Placed{" "}
                        <time dateTime={order.createdAt}>
                          {new Date(order.createdAt).toLocaleDateString(
                            undefined,
                            { year: "numeric", month: "long", day: "numeric" },
                          )}
                        </time>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={classNames(
                          "rounded-full px-2.5 py-1 text-xs font-medium",
                          order.status === "return_requested" &&
                            "bg-amber-50 text-amber-700",
                          order.status === "return_in_transit" &&
                            "bg-blue-50 text-blue-700",
                          order.status === "return_received" &&
                            "bg-sky-50 text-sky-700",
                          order.status === "returned" &&
                            "bg-emerald-50 text-emerald-700",
                          order.status === "cancelled" &&
                            "bg-red-50 text-red-700",
                          order.status === "refunded" &&
                            "bg-emerald-50 text-emerald-700",
                          isReplacement && "bg-violet-50 text-violet-700",
                          !hideTracker && "bg-indigo-50 text-indigo-700",
                        )}
                      >
                        {statusLabel(order.status)}
                      </span>
                      <p className="text-base font-medium text-gray-900">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                  </div>

                  {/* Return after delivery — partial or full */}
                  {isReturnFlow && (
                    <div
                      className={classNames(
                        "border-b border-gray-200 px-4 py-3 text-sm sm:px-6",
                        order.status === "return_requested" &&
                          "bg-amber-50 text-amber-800",
                        order.status === "return_in_transit" &&
                          "bg-blue-50 text-blue-800",
                        order.status === "return_received" &&
                          "bg-sky-50 text-sky-800",
                        (order.status === "returned" ||
                          order.status === "refunded") &&
                          "bg-emerald-50 text-emerald-800",
                      )}
                    >
                      {order.status === "return_requested" &&
                        "Return requested. We're reviewing it — no refund has been issued yet."}
                      {order.status === "return_in_transit" &&
                        (order.return?.refundStatus === "not_required"
                          ? "Your return was approved. Send the item(s) back to us. No payment was collected, so no refund is due."
                          : `Your return was approved. Send the item(s) back — we'll refund ${returnAmount(
                              order,
                            )} once they reach our warehouse.`)}
                      {order.status === "return_received" &&
                        `We've received your return. A refund of ${returnAmount(
                          order,
                        )} is being processed.`}
                      {order.status === "returned" &&
                        "Return completed. No payment was collected, so no refund was due."}
                      {order.status === "refunded" &&
                        `Return completed. A refund of ${returnAmount(
                          order,
                        )} has been processed.`}
                    </div>
                  )}

                  {/* A declined return returns the order to delivered. */}
                  {order.status === "delivered" &&
                    order.return?.rejectedAt &&
                    !isReturnFlow && (
                      <div className="border-b border-gray-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:px-6">
                        Your return request was declined
                        {order.return.rejectionReason
                          ? `: ${order.return.rejectionReason}`
                          : "."}{" "}
                        You can request a return again.
                      </div>
                    )}

                  {/* Cancellation / refund of an order that never arrived */}
                  {isCancelled && !isReturnFlow && (
                    <div
                      className={classNames(
                        "border-b border-gray-200 px-4 py-3 text-sm sm:px-6",
                        order.status === "return_in_transit"
                          ? "bg-blue-50 text-blue-800"
                          : "bg-amber-50 text-amber-800",
                      )}
                    >
                      {order.status === "return_in_transit"
                        ? `This order was cancelled after it shipped. The parcel is on its way back to us.${
                            refundNotRequired
                              ? " No payment was collected, so no refund is needed."
                              : ` We'll refund ${formatCurrency(
                                  order.cancellation?.refundAmount ??
                                    order.total,
                                )} once it reaches our warehouse.`
                          }`
                        : order.status === "refunded"
                          ? `This order was cancelled and a refund of ${formatCurrency(
                              order.cancellation?.refundAmount ?? order.total,
                            )} has been processed.`
                          : refundNotRequired
                            ? "This order was cancelled. No payment was collected, so no refund is needed."
                            : `This order was cancelled. A refund of ${formatCurrency(
                                order.cancellation?.refundAmount ?? order.total,
                              )} is being processed.`}
                    </div>
                  )}

                  {/* Replacement (exchange) notice — no money involved */}
                  {isReplacement && (
                    <div className="border-b border-gray-200 bg-violet-50 px-4 py-3 text-sm text-violet-800 sm:px-6">
                      {order.status === "replacement_requested" &&
                        "Replacement requested. We're reviewing your request and will arrange a pickup — no payment is involved."}
                      {order.status === "replacement_out" &&
                        "A replacement unit is on its way. Once your original item reaches us we'll close out the exchange."}
                      {order.status === "replacement_completed" &&
                        "Replacement completed. No payment was taken for this exchange."}
                    </div>
                  )}

                  <div className="px-4 py-6 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:p-8">
                    <div className="lg:col-span-7">
                      <h3 className="sr-only">Items purchased</h3>
                      <ul role="list" className="divide-y divide-gray-200">
                        {order.items.map((item, index) => (
                          <li
                            key={`${item.product}-${item.color}-${item.size}-${index}`}
                            className="flex py-4 first:pt-0 last:pb-0"
                          >
                            {item.image && (
                              <img
                                alt={item.title}
                                src={item.image}
                                className="size-20 shrink-0 rounded-lg object-cover"
                              />
                            )}
                            <div className="ml-4 flex flex-1 flex-col">
                              <div className="flex justify-between">
                                <h4 className="text-sm font-medium text-gray-900">
                                  <Link to={`/product/${item.product}`}>
                                    {item.title}
                                  </Link>
                                </h4>
                                <p className="text-sm font-medium text-gray-900">
                                  {formatCurrency(item.price * item.quantity)}
                                </p>
                              </div>
                              <p className="mt-1 text-sm text-gray-500">
                                {item.color} · {item.size} · Qty {item.quantity}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 lg:col-span-5 lg:mt-0">
                      <dl className="grid grid-cols-2 gap-x-6 text-sm">
                        <div>
                          <dt className="font-medium text-gray-900">
                            Delivery address
                          </dt>
                          <dd className="mt-3 text-gray-500">
                            <span className="block">
                              {order.shippingAddress.fullName}
                            </span>
                            <span className="block">
                              {order.shippingAddress.addressLine1}
                              {order.shippingAddress.addressLine2
                                ? `, ${order.shippingAddress.addressLine2}`
                                : ""}
                            </span>
                            <span className="block">
                              {order.shippingAddress.city},{" "}
                              {order.shippingAddress.state} -{" "}
                              {order.shippingAddress.pincode}
                            </span>
                            <span className="block">
                              {order.shippingAddress.country}
                            </span>
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-900">
                            Contact & shipping
                          </dt>
                          <dd className="mt-3 space-y-3 text-gray-500">
                            <p>{order.contactEmail}</p>
                            <p>{order.shippingAddress.phone}</p>
                            <p>{order.deliveryMethod} delivery</p>
                            <p>
                              {paymentMethodLabel(order)} ·{" "}
                              {paymentStatusLabel(order)}
                            </p>
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 px-4 py-6 sm:px-6 lg:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h4 className="sr-only">Status</h4>
                      <p className="text-sm font-medium text-gray-900">
                        {statusLabel(order.status)}
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Download invoice — available for every order */}
                        <button
                          type="button"
                          onClick={() => handleDownloadInvoice(order)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <ArrowDownTrayIcon
                            aria-hidden="true"
                            className="size-4"
                          />
                          Download invoice
                        </button>

                        {/* Cancel button — only while the order can still be cancelled */}
                        {canCancel(order.status) && (
                          <button
                            type="button"
                            onClick={() => openCancel(order)}
                            className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                          >
                            Cancel order
                          </button>
                        )}

                        {/* Return — delivered orders only */}
                        {canRequestReturn(order) && (
                          <button
                            type="button"
                            onClick={() => openReturn(order)}
                            className="rounded-md border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50"
                          >
                            Request return
                          </button>
                        )}

                        {/* Replacement — delivered orders only */}
                        {canRequestReplacement(order) && (
                          <button
                            type="button"
                            onClick={() => openReplace(order)}
                            className="rounded-md border border-violet-300 px-3 py-1.5 text-sm font-medium text-violet-700 hover:bg-violet-50"
                          >
                            Request replacement
                          </button>
                        )}

                        {order.status === "shipped" && (
                          <p className="text-xs text-gray-500">
                            This order has shipped and can no longer be
                            cancelled. Contact support for help.
                          </p>
                      )}
                      </div>
                    </div>

                    {/* Tracking bar (hidden for cancelled/replacement orders) */}
                    {!hideTracker && (
                      <div aria-hidden="true" className="mt-6">
                        <div className="relative">
                          <div className="overflow-hidden rounded-full bg-gray-200">
                            <div
                              style={{
                                width: `${(step / (STEPS.length - 1)) * 100}%`,
                              }}
                              className="h-2 rounded-full bg-indigo-600 transition-all duration-300"
                            />
                          </div>
                        </div>
                        <div className="mt-6 hidden text-sm font-medium text-gray-600 sm:flex sm:justify-between">
                          {STEPS.map((label, index) => (
                            <div
                              key={label}
                              className={classNames(
                                step >= index ? "text-indigo-600" : "",
                                index === 0
                                  ? "text-left"
                                  : index === STEPS.length - 1
                                    ? "text-right"
                                    : "text-center",
                              )}
                            >
                              {label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel confirmation dialog */}
      <Dialog
        open={!!cancelTarget}
        onClose={closeCancel}
        className="relative z-10"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 data-closed:sm:translate-y-0 data-closed:sm:scale-95"
            >
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:size-10">
                  <ExclamationTriangleIcon
                    aria-hidden="true"
                    className="size-6 text-red-600"
                  />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <DialogTitle
                    as="h3"
                    className="text-base font-semibold text-gray-900"
                  >
                    Cancel order {cancelTarget?.orderNumber}
                  </DialogTitle>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {cancelTarget &&
                      isCodOrder(cancelTarget) &&
                      (cancelTarget.paymentStatus || "pending") === "pending"
                        ? "Are you sure you want to cancel this order? No payment has been collected, so there is no refund — the stock will be returned to the store. This can't be undone."
                        : `Are you sure you want to cancel this order? A refund of ${formatCurrency(
                            cancelTarget?.total,
                          )} will be processed to your original payment method. This can't be undone.`}
                    </p>
                    <label
                      htmlFor="cancel-reason"
                      className="mt-4 block text-sm font-medium text-gray-700"
                    >
                      Reason (optional)
                    </label>
                    <textarea
                      id="cancel-reason"
                      rows={2}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Tell us why you're cancelling"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={confirmCancel}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60 sm:ml-3 sm:w-auto"
                >
                  {cancelling ? "Cancelling..." : "Yes, cancel order"}
                </button>
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={closeCancel}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 inset-ring inset-ring-gray-300 hover:bg-gray-50 disabled:opacity-60 sm:mt-0 sm:w-auto"
                >
                  Keep order
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      {/* Replacement request dialog */}
      <Dialog
        open={!!replaceTarget}
        onClose={closeReplace}
        className="relative z-10"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 data-closed:sm:translate-y-0 data-closed:sm:scale-95"
            >
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-violet-100 sm:mx-0 sm:size-10">
                  <ArrowsRightLeftIcon
                    aria-hidden="true"
                    className="size-6 text-violet-600"
                  />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <DialogTitle
                    as="h3"
                    className="text-base font-semibold text-gray-900"
                  >
                    Request replacement for {replaceTarget?.orderNumber}
                  </DialogTitle>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      We'll send you a new unit of the same items and arrange a
                      pickup for your original order. <strong>No payment is
                      involved.</strong>
                    </p>
                    <label
                      htmlFor="replace-reason"
                      className="mt-4 block text-sm font-medium text-gray-700"
                    >
                      Reason (optional)
                    </label>
                    <textarea
                      id="replace-reason"
                      rows={2}
                      value={replaceReason}
                      onChange={(e) => setReplaceReason(e.target.value)}
                      placeholder="e.g. wrong size received, item defective"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={replacing}
                  onClick={confirmReplace}
                  className="inline-flex w-full justify-center rounded-md bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60 sm:ml-3 sm:w-auto"
                >
                  {replacing ? "Requesting..." : "Yes, request replacement"}
                </button>
                <button
                  type="button"
                  disabled={replacing}
                  onClick={closeReplace}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 inset-ring inset-ring-gray-300 hover:bg-gray-50 disabled:opacity-60 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      {/* Return request dialog */}
      <Dialog
        open={!!returnTarget}
        onClose={closeReturn}
        className="relative z-10"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 data-closed:sm:translate-y-0 data-closed:sm:scale-95"
            >
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-amber-100 sm:mx-0 sm:size-10">
                  <ArrowUturnLeftIcon
                    aria-hidden="true"
                    className="size-6 text-amber-600"
                  />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <DialogTitle
                    as="h3"
                    className="text-base font-semibold text-gray-900"
                  >
                    Return items from {returnTarget?.orderNumber}
                  </DialogTitle>
                  <p className="mt-2 text-sm text-gray-500">
                    Choose the items and quantities you're sending back. We'll
                    arrange pickup once your request is approved, and issue the
                    refund after we receive them.
                  </p>

                  <div className="mt-4 space-y-2">
                    {(returnTarget?.items || []).map((item, index) => {
                      const quantity = returnSelections[index] || 0;
                      return (
                        <div
                          key={`${item.product}-${item.color}-${item.size}-${index}`}
                          className="rounded-md border border-gray-200 px-3 py-2"
                        >
                          <label className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={quantity > 0}
                              onChange={(e) =>
                                toggleReturnItem(
                                  index,
                                  e.target.checked,
                                  item.quantity,
                                )
                              }
                              className="mt-1 size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="flex-1">
                              <span className="block text-sm font-medium text-gray-900">
                                {item.title}
                              </span>
                              <span className="block text-xs text-gray-500">
                                {[item.color, item.size]
                                  .filter(Boolean)
                                  .join(" · ")}{" "}
                                · {formatCurrency(item.price)} each
                              </span>
                            </span>
                          </label>
                          {quantity > 0 && (
                            <div className="mt-2 flex items-center gap-2 pl-7">
                              <label
                                htmlFor={`return-qty-${index}`}
                                className="text-xs text-gray-500"
                              >
                                Quantity
                              </label>
                              <select
                                id={`return-qty-${index}`}
                                value={quantity}
                                onChange={(e) =>
                                  changeReturnQuantity(index, e.target.value)
                                }
                                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                              >
                                {Array.from(
                                  { length: item.quantity },
                                  (_, i) => i + 1,
                                ).map((n) => (
                                  <option key={n} value={n}>
                                    {n} of {item.quantity}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <label
                    htmlFor="return-reason"
                    className="mt-4 block text-sm font-medium text-gray-700"
                  >
                    Reason (required)
                  </label>
                  <textarea
                    id="return-reason"
                    rows={2}
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="e.g. wrong size, doesn't fit, damaged"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />

                  <div className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-sm">
                    {returnPaymentPending ? (
                      <p className="text-gray-600">
                        No payment was collected for this order, so no refund
                        will be issued.
                      </p>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-600">
                          Estimated refund
                          {returnItemCount > 0
                            ? ` (${returnItemCount} item${
                                returnItemCount === 1 ? "" : "s"
                              })`
                            : ""}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(estimatedRefund)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={returning}
                  onClick={confirmReturn}
                  className="inline-flex w-full justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60 sm:ml-3 sm:w-auto"
                >
                  {returning ? "Requesting..." : "Yes, request return"}
                </button>
                <button
                  type="button"
                  disabled={returning}
                  onClick={closeReturn}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 inset-ring inset-ring-gray-300 hover:bg-gray-50 disabled:opacity-60 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Orders;
