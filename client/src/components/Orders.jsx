import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import useAuth from "../customhooks/useAuth";
import BackToHome from "./BackToHome";
import { OrdersSkeleton } from "./Loader";
import { getOrders, cancelOrder, requestReplacement } from "../utils/order";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import {
  ExclamationTriangleIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

// Ordered tracking steps — index matches the statusStep() value below.
const STEPS = ["Order placed", "Processing", "Shipped", "Delivered"];

// Orders that have left the linear placed→delivered track hide the progress
// bar and show a notice instead.
const CANCELLED_STATUSES = ["return_in_transit", "cancelled", "refunded"];

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

// A customer may cancel while the order is still placed/processing.
const canCancel = (status) => status === "placed" || status === "processing";

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

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
      toast.success("Order cancelled. Your refund is being processed.");
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
              // Either a cancellation-family or replacement-family state hides
              // the linear delivery tracker.
              const hideTracker = isCancelled || isReplacement;
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
                          order.status === "return_in_transit" &&
                            "bg-blue-50 text-blue-700",
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

                  {/* Returning / cancellation / refund / replacement notice */}
                  {isCancelled && (
                    <div
                      className={classNames(
                        "border-b border-gray-200 px-4 py-3 text-sm sm:px-6",
                        order.status === "return_in_transit"
                          ? "bg-blue-50 text-blue-800"
                          : "bg-amber-50 text-amber-800",
                      )}
                    >
                      {order.status === "return_in_transit"
                        ? `This order was cancelled after it shipped. The parcel is on its way back to us — we'll refund ${formatCurrency(
                            order.cancellation?.refundAmount ?? order.total,
                          )} once it reaches our warehouse.`
                        : order.status === "refunded"
                          ? `This order was cancelled and a refund of ${formatCurrency(
                              order.cancellation?.refundAmount ?? order.total,
                            )} has been processed.`
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
                      Are you sure you want to cancel this order? A refund of{" "}
                      {formatCurrency(cancelTarget?.total)} will be processed to
                      your original payment method. This can't be undone.
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
    </div>
  );
};

export default Orders;
