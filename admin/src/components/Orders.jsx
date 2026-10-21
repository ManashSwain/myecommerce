import { useEffect, useMemo, useState } from "react";
import { ChevronDownIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { toast } from "react-toastify";
import {
  approveReturnAdmin,
  cancelOrderAdmin,
  completeReplacementAdmin,
  dispatchReplacementAdmin,
  getAllOrders,
  markOrderPaidAdmin,
  receiveReturnAdmin,
  receiveReturnedItemsAdmin,
  refundOrderAdmin,
  rejectReturnAdmin,
  updateOrderStatus,
} from "../utils/order";
import ConfirmModal from "./ConfirmModal";

// Statuses an admin can move an active order to via the dropdown.
const STATUS_OPTIONS = ["placed", "processing", "shipped", "delivered"];

// Every status, used for the filter pills.
const FILTER_OPTIONS = [
  "placed",
  "processing",
  "shipped",
  "delivered",
  "return_requested",
  "return_in_transit",
  "return_received",
  "returned",
  "cancelled",
  "refunded",
  "replacement_requested",
  "replacement_out",
  "replacement_completed",
];

// Colours for the status pill
const statusStyles = {
  placed: "bg-gray-100 text-gray-700",
  processing: "bg-amber-100 text-amber-700",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  return_requested: "bg-amber-100 text-amber-700",
  return_in_transit: "bg-sky-100 text-sky-700",
  return_received: "bg-sky-100 text-sky-700",
  returned: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-emerald-100 text-emerald-700",
  replacement_requested: "bg-violet-100 text-violet-700",
  replacement_out: "bg-violet-100 text-violet-700",
  replacement_completed: "bg-violet-100 text-violet-700",
};

const STATUS_LABELS = {
  return_requested: "Return requested",
  return_in_transit: "Return in transit",
  return_received: "Return received",
  returned: "Return completed",
  replacement_requested: "Replacement requested",
  replacement_out: "Replacement dispatched",
  replacement_completed: "Replacement completed",
};
const statusLabel = (status) => {
  if (!status) return "Placed";
  if (STATUS_LABELS[status]) return STATUS_LABELS[status];
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// Terminal states can't be cancelled any further. return_in_transit (needs
// receive) and the replacement states are handled by their own actions, so
// none of them are "terminal" for the generic cancel button.
const isTerminal = (status) =>
  ["delivered", "cancelled", "refunded"].includes(status);
// The status dropdown must never be shown for a non-linear state.
const isReplacement = (status) =>
  typeof status === "string" && status.startsWith("replacement");
const isReturnStatus = (status) =>
  typeof status === "string" &&
  (status.startsWith("return_") || status === "returned");

const isLockedStatus = (status) =>
  isTerminal(status) || isReturnStatus(status) || isReplacement(status);

const canCancel = (status) =>
  !isTerminal(status) && !isReturnStatus(status) && !isReplacement(status);
// A return-in-transit order needs to be received before it can be refunded.
const canReceiveCancelledReturn = (order) =>
  order.status === "return_in_transit" && !order.return?.requestedAt;
const canReceiveReturnedItems = (order) =>
  order.status === "return_in_transit" && Boolean(order.return?.requestedAt);
const canApproveReturn = (order) =>
  order.status === "return_requested" && Boolean(order.return?.requestedAt);
const isReturnRefund = (order) =>
  order.status === "return_received" && Boolean(order.return?.requestedAt);
const canRefund = (order) =>
  (order.status === "cancelled" &&
    order.cancellation?.refundStatus !== "completed" &&
    order.cancellation?.refundStatus !== "not_required") ||
  (isReturnRefund(order) &&
    order.return?.refundStatus !== "completed" &&
    order.return?.refundStatus !== "not_required");
// Replacement actions.
const canDispatchReplacement = (status) => status === "replacement_requested";
const canCompleteReplacement = (status) => status === "replacement_out";

// Cash on Delivery helpers.
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
      return "Cash due";
    }
    if (status === "paid") return "Cash collected";
  }
  return PAYMENT_STATUS_LABELS[status] || status;
};
// A COD order can be marked paid until it is cancelled/returned or already paid.
const canMarkPaid = (order) =>
  isCodOrder(order) &&
  (order.paymentStatus || "pending") === "pending" &&
  ![
    "cancelled",
    "refunded",
    "return_in_transit",
    "return_received",
    "returned",
  ].includes(order.status);

const returnAmount = (order) =>
  formatCurrency(order.return?.refundAmount ?? order.total);

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

// Amounts are in Indian Rupees to match the storefront (cart/checkout use ₹).
const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Search + pagination
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders();
  }, []);

  // Apply the status filter + search locally so the counts stay accurate
  const visibleOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (filter !== "all" && order.status !== filter) return false;
      if (!term) return true;
      // Search by order number, customer name or contact email
      const haystack = [
        order.orderNumber,
        order.shippingAddress?.fullName,
        order.contactEmail,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [orders, filter, search]);

  const totalPages = Math.max(1, Math.ceil(visibleOrders.length / pageSize));
  // Clamp during render so the page never points past the last page
  // (e.g. after filtering narrows the result set).
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const paginatedOrders = visibleOrders.slice(pageStart, pageStart + pageSize);

  const counts = useMemo(() => {
    const base = { all: orders.length };
    FILTER_OPTIONS.forEach((status) => {
      base[status] = orders.filter((o) => o.status === status).length;
    });
    return base;
  }, [orders]);

  // Collapse any open accordion when the page changes
  const goToPage = (next) => {
    setPage(Math.min(Math.max(1, next), totalPages));
    setOpenId(null);
  };

  const handleStatusChange = async (order, status) => {
    // Delivering a COD order doesn't tell us whether the courier got the
    // cash. Ask explicitly instead of guessing either way.
    if (
      status === "delivered" &&
      isCodOrder(order) &&
      (order.paymentStatus || "pending") === "pending"
    ) {
      setDeliveryTarget(order);
      setCollectCash(true);
      setPaymentReference("");
      return;
    }

    const orderId = order._id;
    const previous = orders;
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o._id === orderId ? { ...o, status } : o))
    );
    setUpdatingId(orderId);
    try {
      const updated = await updateOrderStatus(orderId, status);
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o))
      );
      toast.success(`Order marked as ${status}`);
    } catch (err) {
      setOrders(previous); // rollback
      toast.error(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Cancel + receive-return + refund + replacement flow
  const [cancelTarget, setCancelTarget] = useState(null);
  const [returnTarget, setReturnTarget] = useState(null);
  const [refundTarget, setRefundTarget] = useState(null);
  const [paidTarget, setPaidTarget] = useState(null);
  const [dispatchTarget, setDispatchTarget] = useState(null);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [deliveryTarget, setDeliveryTarget] = useState(null);
  const [collectCash, setCollectCash] = useState(true);
  const [paymentReference, setPaymentReference] = useState("");
  const [approveReturnTarget, setApproveReturnTarget] = useState(null);
  const [rejectReturnTarget, setRejectReturnTarget] = useState(null);
  const [returnRejectReason, setReturnRejectReason] = useState("");
  const [receiveReturnedTarget, setReceiveReturnedTarget] = useState(null);
  const [restockReturnedItems, setRestockReturnedItems] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);

  const confirmApproveReturn = async () => {
    if (!approveReturnTarget) return;
    setActionBusy(true);
    try {
      const updated = await approveReturnAdmin(approveReturnTarget._id);
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o))
      );
      toast.success(`Return approved for ${updated.orderNumber}`);
      setApproveReturnTarget(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const confirmRejectReturn = async () => {
    if (!rejectReturnTarget) return;
    if (!returnRejectReason.trim()) {
      toast.error("Give a reason so the customer knows why.");
      return;
    }
    setActionBusy(true);
    try {
      const updated = await rejectReturnAdmin(
        rejectReturnTarget._id,
        returnRejectReason.trim()
      );
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o))
      );
      toast.success(
        `Return rejected for ${updated.orderNumber} — the order stays delivered`
      );
      setRejectReturnTarget(null);
      setReturnRejectReason("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const confirmReceiveReturnedItems = async () => {
    if (!receiveReturnedTarget) return;
    setActionBusy(true);
    try {
      const updated = await receiveReturnedItemsAdmin(
        receiveReturnedTarget._id,
        restockReturnedItems
      );
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o))
      );
      toast.success(
        updated.status === "returned"
          ? `Return received for ${updated.orderNumber} — no refund due`
          : restockReturnedItems
            ? `Return received for ${updated.orderNumber} — stock restored`
            : `Return received for ${updated.orderNumber} — not restocked`
      );
      setReceiveReturnedTarget(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const confirmDelivery = async () => {
    if (!deliveryTarget) return;
    setActionBusy(true);
    try {
      const updated = await updateOrderStatus(deliveryTarget._id, "delivered", {
        collectCash,
        paymentReference: paymentReference.trim(),
      });
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o))
      );
      toast.success(
        collectCash
          ? `Order ${updated.orderNumber} delivered — cash collection recorded`
          : `Order ${updated.orderNumber} delivered — cash still pending`
      );
      setDeliveryTarget(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const confirmDispatchReplacement = async () => {
    if (!dispatchTarget) return;
    setActionBusy(true);
    try {
      const updated = await dispatchReplacementAdmin(dispatchTarget._id);
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o))
      );
      toast.success(
        `Replacement dispatched for ${updated.orderNumber} — stock deducted`
      );
      setDispatchTarget(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const confirmCompleteReplacement = async () => {
    if (!completeTarget) return;
    setActionBusy(true);
    try {
      const updated = await completeReplacementAdmin(completeTarget._id);
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o))
      );
      toast.success(`Replacement completed for ${updated.orderNumber}`);
      setCompleteTarget(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const confirmReceiveReturn = async () => {
    if (!returnTarget) return;
    setActionBusy(true);
    try {
      const updated = await receiveReturnAdmin(returnTarget._id);
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o))
      );
      toast.success(
        `Return received for ${updated.orderNumber} — stock restored`
      );
      setReturnTarget(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setActionBusy(true);
    try {
      const updated = await cancelOrderAdmin(cancelTarget._id);
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o))
      );
      toast.success(`Order ${updated.orderNumber} cancelled`);
      setCancelTarget(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const confirmRefund = async () => {
    if (!refundTarget) return;
    setActionBusy(true);
    try {
      const updated = await refundOrderAdmin(refundTarget._id);
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o))
      );
      toast.success(`Refund processed for ${updated.orderNumber}`);
      setRefundTarget(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const confirmMarkPaid = async () => {
    if (!paidTarget) return;
    setActionBusy(true);
    try {
      const updated = await markOrderPaidAdmin(paidTarget._id);
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o))
      );
      toast.success(`Cash collection recorded for ${updated.orderNumber}`);
      setPaidTarget(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Orders
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {orders.length} order{orders.length === 1 ? "" : "s"} placed
          </p>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="mt-6 flex flex-wrap gap-2">
        {["all", ...FILTER_OPTIONS].map((status) => (
          <button
            key={status}
            onClick={() => {
              setFilter(status);
              setPage(1);
              setOpenId(null);
            }}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition ${
              filter === status
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-600"
            }`}
          >
            {status === "all" ? "All" : statusLabel(status)}
            <span
              className={`ml-2 ${
                filter === status ? "text-blue-100" : "text-gray-400"
              }`}
            >
              {counts[status]}
            </span>
          </button>
        ))}
      </div>

      {/* Search + records per page */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <MagnifyingGlassIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
              setOpenId(null);
            }}
            placeholder="Search by order number, name or email"
            className="block w-full rounded-md border border-gray-300 bg-white py-2 pr-3 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <label htmlFor="page-size">Rows per page</label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
              setOpenId(null);
            }}
            className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
          >
            {[5, 10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="mt-10 text-sm text-gray-500">Loading orders...</p>
      ) : visibleOrders.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-gray-300 py-24 text-center">
          <p className="text-sm text-gray-500">
            {search.trim()
              ? "No orders match your search."
              : "No orders found."}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 space-y-4">
            {paginatedOrders.map((order) => {
            const isOpen = openId === order._id;
            return (
              <div
                key={order._id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white"
              >
                {/* Accordion header */}
                <button
                  onClick={() => setOpenId(isOpen ? null : order._id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <UserCircleIcon className="size-8 shrink-0 text-gray-400" />
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <span className="truncate">{order.orderNumber}</span>
                        {isCodOrder(order) && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-700 uppercase">
                            COD
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {order.shippingAddress?.fullName} ·{" "}
                        {order.contactEmail}
                      </p>
                    </div>
                  </div>

                  <div className="hidden items-center gap-6 sm:flex">
                    <span className="text-xs text-gray-500">
                      {formatDate(order.createdAt)}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(order.total)}
                    </span>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                      statusStyles[order.status] || statusStyles.placed
                    }`}
                  >
                    {statusLabel(order.status)}
                  </span>

                  <ChevronDownIcon
                    className={`size-5 shrink-0 text-gray-400 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Accordion body */}
                {isOpen && (
                  <div className="border-t border-gray-200 bg-gray-50/60 px-5 py-5">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                      {/* Items */}
                      <div className="lg:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-900">
                          Items ({order.items.length})
                        </h3>
                        <ul className="mt-3 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
                          {order.items.map((item, index) => (
                            <li
                              key={`${item.product}-${item.color}-${item.size}-${index}`}
                              className="flex items-center gap-4 p-3"
                            >
                              {item.image && (
                                <img
                                  alt={item.title}
                                  src={item.image}
                                  className="size-14 shrink-0 rounded-md object-cover"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-gray-900">
                                  {item.title}
                                </p>
                                <p className="mt-0.5 text-xs text-gray-500">
                                  {item.color} · {item.size} · Qty{" "}
                                  {item.quantity}
                                </p>
                              </div>
                              <p className="text-sm font-medium text-gray-900">
                                {formatCurrency(item.price * item.quantity)}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Meta: address, payment, status control */}
                      <div className="space-y-5">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">
                            Delivery address
                          </h3>
                          <div className="mt-2 text-sm text-gray-600">
                            <p>{order.shippingAddress?.fullName}</p>
                            <p>{order.shippingAddress?.addressLine1}</p>
                            {order.shippingAddress?.addressLine2 && (
                              <p>{order.shippingAddress.addressLine2}</p>
                            )}
                            <p>
                              {order.shippingAddress?.city},{" "}
                              {order.shippingAddress?.state} -{" "}
                              {order.shippingAddress?.pincode}
                            </p>
                            <p>{order.shippingAddress?.country}</p>
                            <p className="mt-1 text-gray-500">
                              {order.shippingAddress?.phone}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">
                            Order summary
                          </h3>
                          <dl className="mt-2 space-y-1 text-sm text-gray-600">
                            <div className="flex justify-between">
                              <dt>Subtotal</dt>
                              <dd>{formatCurrency(order.subtotal)}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt>Shipping</dt>
                              <dd>{formatCurrency(order.shipping)}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt>Taxes</dt>
                              <dd>{formatCurrency(order.taxes)}</dd>
                            </div>
                            <div className="flex justify-between border-t border-gray-200 pt-1 font-medium text-gray-900">
                              <dt>Total</dt>
                              <dd>{formatCurrency(order.total)}</dd>
                            </div>
                          </dl>
                          <p className="mt-2 text-xs text-gray-500">
                            {order.deliveryMethod} delivery ·{" "}
                            {order.contactEmail}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {paymentMethodLabel(order)} ·{" "}
                            <span
                              className={`font-medium ${
                                (order.paymentStatus || "pending") === "paid"
                                  ? "text-emerald-700"
                                  : (order.paymentStatus || "pending") ===
                                      "pending"
                                    ? "text-amber-700"
                                    : "text-gray-700"
                              }`}
                            >
                              {paymentStatusLabel(order)}
                            </span>
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-900">
                            {isLockedStatus(order.status)
                              ? "Status"
                              : "Update status"}
                          </label>
                          {isLockedStatus(order.status) ? (
                            <p
                              className={`mt-2 rounded-md px-3 py-2 text-sm ${
                                statusStyles[order.status] || statusStyles.placed
                              }`}
                            >
                              {statusLabel(order.status)}
                              {order.status === "return_requested" &&
                                " — needs approval"}
                              {order.status === "return_in_transit" &&
                                (order.return?.requestedAt
                                  ? " — awaiting returned items"
                                  : " — awaiting return")}
                              {order.status === "return_received" &&
                                " — refund pending"}
                              {order.status === "returned" && " — no refund due"}
                              {order.status === "cancelled" &&
                                (order.cancellation?.refundStatus ===
                                "not_required"
                                  ? " — no refund due"
                                  : " — awaiting refund")}
                              {order.status === "refunded" && " — refund completed"}
                              {order.status === "replacement_requested" &&
                                " — needs dispatch"}
                              {order.status === "replacement_out" &&
                                " — awaiting return"}
                              {order.status === "replacement_completed" &&
                                " — exchange closed"}
                            </p>
                          ) : (
                            <select
                              value={order.status}
                              disabled={updatingId === order._id}
                              onChange={(e) =>
                                handleStatusChange(order, e.target.value)
                              }
                              className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                            >
                              {STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>
                                  {statusLabel(status)}
                                </option>
                              ))}
                            </select>
                          )}
                          {updatingId === order._id && (
                            <p className="mt-1 text-xs text-gray-500">
                              Saving...
                            </p>
                          )}

                          {/* Cancellation / return / refund details */}
                          {order.cancellation?.cancelledAt && (
                            <div className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
                              <p>
                                Cancelled by{" "}
                                <span className="font-medium capitalize">
                                  {order.cancellation.cancelledBy || "user"}
                                </span>{" "}
                                on{" "}
                                {formatDate(order.cancellation.cancelledAt)}
                              </p>
                              {order.cancellation.reason && (
                                <p className="mt-1">
                                  Reason: {order.cancellation.reason}
                                </p>
                              )}
                              {order.cancellation.wasShipped && (
                                <p className="mt-1">
                                  Stock:{" "}
                                  <span className="font-medium">
                                    {order.cancellation.stockRestored
                                      ? "returned to inventory"
                                      : "still in transit (not restocked)"}
                                  </span>
                                </p>
                              )}
                              {order.cancellation.returnedAt && (
                                <p className="mt-1">
                                  Return received:{" "}
                                  {formatDate(order.cancellation.returnedAt)}
                                </p>
                              )}
                              <p className="mt-1">
                                Refund:{" "}
                                <span className="font-medium capitalize">
                                  {(
                                    order.cancellation.refundStatus || "pending"
                                  ).replace("_", " ")}
                                </span>
                                {order.cancellation.refundAmount
                                  ? ` · ${formatCurrency(order.cancellation.refundAmount)}`
                                  : ""}
                              </p>
                            </div>
                          )}

                          {/* Return details (partial or full) */}
                          {order.return?.requestedAt && (
                            <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
                              <p>
                                Return requested on{" "}
                                {formatDate(order.return.requestedAt)}
                              </p>
                              {order.return.reason && (
                                <p className="mt-1">
                                  Reason: {order.return.reason}
                                </p>
                              )}
                              {order.return.items?.length > 0 && (
                                <p className="mt-1">
                                  Items:{" "}
                                  {order.return.items
                                    .map(
                                      (item) =>
                                        `${item.title} (${item.color} / ${item.size}) ×${item.quantity}`
                                    )
                                    .join(", ")}
                                </p>
                              )}
                              <p className="mt-1">
                                Refund:{" "}
                                <span className="font-medium capitalize">
                                  {(
                                    order.return.refundStatus || "not_required"
                                  ).replace("_", " ")}
                                </span>
                                {order.return.refundAmount
                                  ? ` · ${formatCurrency(
                                      order.return.refundAmount
                                    )}`
                                  : ""}
                              </p>
                              {order.return.approvedAt && (
                                <p className="mt-1">
                                  Approved:{" "}
                                  {formatDate(order.return.approvedAt)}
                                </p>
                              )}
                              {order.return.rejectedAt && (
                                <p className="mt-1">
                                  Rejected:{" "}
                                  {formatDate(order.return.rejectedAt)}
                                  {order.return.rejectionReason
                                    ? ` · ${order.return.rejectionReason}`
                                    : ""}
                                </p>
                              )}
                              {order.return.receivedAt && (
                                <p className="mt-1">
                                  Received:{" "}
                                  {formatDate(order.return.receivedAt)} · stock{" "}
                                  {order.return.stockRestored
                                    ? "restored"
                                    : "not restocked"}
                                </p>
                              )}
                              {order.return.refundedAt && (
                                <p className="mt-1">
                                  Refunded:{" "}
                                  {formatDate(order.return.refundedAt)}
                                  {order.return.refundReference
                                    ? ` · ${order.return.refundReference}`
                                    : ""}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Replacement details (no money involved) */}
                          {order.replacement?.requestedAt && (
                            <div className="mt-3 rounded-md bg-violet-50 px-3 py-2 text-xs text-violet-800">
                              <p>
                                Replacement requested by{" "}
                                <span className="font-medium capitalize">
                                  {order.replacement.requestedBy || "user"}
                                </span>{" "}
                                on {formatDate(order.replacement.requestedAt)}
                              </p>
                              {order.replacement.reason && (
                                <p className="mt-1">
                                  Reason: {order.replacement.reason}
                                </p>
                              )}
                              {order.replacement.approvedAt && (
                                <p className="mt-1">
                                  Dispatched:{" "}
                                  {formatDate(order.replacement.approvedAt)} ·
                                  stock {order.replacement.replacementStockDeducted
                                    ? "deducted"
                                    : "not deducted"}
                                </p>
                              )}
                              {order.replacement.completedAt && (
                                <p className="mt-1">
                                  Completed:{" "}
                                  {formatDate(order.replacement.completedAt)} ·
                                  original unit{" "}
                                  {order.replacement.stockRestored
                                    ? "restocked"
                                    : "not restocked"}
                                </p>
                              )}
                              <p className="mt-1 font-medium">
                                No payment involved (exchange).
                              </p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {canCancel(order.status) && (
                              <button
                                type="button"
                                onClick={() => setCancelTarget(order)}
                                className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                              >
                                Cancel order
                              </button>
                            )}
                            {canApproveReturn(order) && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setApproveReturnTarget(order)}
                                  className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
                                >
                                  Approve return
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectReturnTarget(order);
                                    setReturnRejectReason("");
                                  }}
                                  className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                                >
                                  Reject return
                                </button>
                              </>
                            )}
                            {canReceiveReturnedItems(order) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setReceiveReturnedTarget(order);
                                  setRestockReturnedItems(true);
                                }}
                                className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700"
                              >
                                Receive returned items
                              </button>
                            )}
                            {canReceiveCancelledReturn(order) && (
                              <button
                                type="button"
                                onClick={() => setReturnTarget(order)}
                                className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700"
                              >
                                Receive return
                              </button>
                            )}
                            {canRefund(order) && (
                              <button
                                type="button"
                                onClick={() => setRefundTarget(order)}
                                className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                              >
                                Process refund
                              </button>
                            )}
                            {canMarkPaid(order) && (
                              <button
                                type="button"
                                onClick={() => setPaidTarget(order)}
                                className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
                              >
                                Mark cash collected
                              </button>
                            )}
                            {canDispatchReplacement(order.status) && (
                              <button
                                type="button"
                                onClick={() => setDispatchTarget(order)}
                                className="rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
                              >
                                Dispatch replacement
                              </button>
                            )}
                            {canCompleteReplacement(order.status) && (
                              <button
                                type="button"
                                onClick={() => setCompleteTarget(order)}
                                className="rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
                              >
                                Complete replacement
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-700">
              {pageStart + 1}
            </span>
            –
            <span className="font-medium text-gray-700">
              {Math.min(pageStart + pageSize, visibleOrders.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-gray-700">
              {visibleOrders.length}
            </span>{" "}
            order{visibleOrders.length === 1 ? "" : "s"}
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goToPage(1)}
              disabled={safePage === 1}
              className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              «
            </button>
            <button
              type="button"
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - safePage) <= 1,
              )
              .map((p, index, arr) => (
                <span key={p} className="flex items-center">
                  {index > 0 && arr[index - 1] !== p - 1 && (
                    <span className="px-1 text-sm text-gray-400">…</span>
                  )}
                  <button
                    type="button"
                    onClick={() => goToPage(p)}
                    className={`min-w-9 rounded-md border px-2.5 py-1.5 text-sm font-medium ${
                      p === safePage
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}

            <button
              type="button"
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => goToPage(totalPages)}
              disabled={safePage === totalPages}
              className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              »
            </button>
          </div>
        </div>
        </>
      )}

      <ConfirmModal
        open={!!deliveryTarget}
        title="Mark as delivered"
        message={`Order ${deliveryTarget?.orderNumber} is Cash on Delivery (${formatCurrency(deliveryTarget?.total)}). Confirm whether the courier collected the cash.`}
        confirmLabel={
          collectCash ? "Deliver and record cash" : "Deliver with cash pending"
        }
        tone={collectCash ? "green" : "red"}
        hideIcon
        onConfirm={() => !actionBusy && confirmDelivery()}
        onCancel={() => !actionBusy && setDeliveryTarget(null)}
      >
        <div className="mt-4 space-y-3">
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
              collectCash
                ? "border-emerald-300 bg-emerald-50"
                : "border-gray-200"
            }`}
          >
            <input
              type="radio"
              name="cash-collected"
              checked={collectCash}
              onChange={() => setCollectCash(true)}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-gray-900">
                Cash collected
              </span>
              <span className="block text-xs text-gray-600">
                The courier received the full amount.
              </span>
            </span>
          </label>

          <label
            className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
              collectCash
                ? "border-gray-200"
                : "border-amber-300 bg-amber-50"
            }`}
          >
            <input
              type="radio"
              name="cash-collected"
              checked={!collectCash}
              onChange={() => setCollectCash(false)}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-gray-900">
                Cash not collected
              </span>
              <span className="block text-xs text-gray-600">
                Mark it delivered but leave payment pending.
              </span>
            </span>
          </label>

          {collectCash ? (
            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                Collection reference (optional)
              </span>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. courier receipt number"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              />
            </label>
          ) : (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              The order will show as delivered with “Cash not collected”. Use
              “Mark cash collected” when the cash arrives.
            </p>
          )}
        </div>
      </ConfirmModal>

      <ConfirmModal
        open={!!cancelTarget}
        title="Cancel order"
        message={`Are you sure you want to cancel order ${cancelTarget?.orderNumber}? Any ordered stock will be returned to inventory. ${
          cancelTarget &&
          isCodOrder(cancelTarget) &&
          (cancelTarget.paymentStatus || "pending") === "pending"
            ? "No payment was collected, so no refund is needed."
            : "A refund will need to be processed."
        }`}
        confirmLabel="Yes, cancel order"
        onConfirm={confirmCancel}
        onCancel={() => !actionBusy && setCancelTarget(null)}
      />

      <ConfirmModal
        open={!!returnTarget}
        title="Receive return"
        message={`Confirm the item(s) for order ${returnTarget?.orderNumber} have been received back at the store. This restores the ordered quantities to inventory so the order can then be refunded.`}
        confirmLabel="Yes, receive return"
        tone="green"
        onConfirm={confirmReceiveReturn}
        onCancel={() => !actionBusy && setReturnTarget(null)}
      />

      <ConfirmModal
        open={!!approveReturnTarget}
        title="Approve return"
        message={`Approve the return for order ${approveReturnTarget?.orderNumber}? The customer can send the selected items back. ${
          approveReturnTarget &&
          (approveReturnTarget.paymentStatus || "pending") === "paid"
            ? `A refund of ${returnAmount(
                approveReturnTarget
              )} will be processed after the items are received.`
            : "No payment was collected, so no refund will be due."
        }`}
        confirmLabel="Yes, approve return"
        tone="green"
        hideIcon
        onConfirm={() => !actionBusy && confirmApproveReturn()}
        onCancel={() => !actionBusy && setApproveReturnTarget(null)}
      />

      <ConfirmModal
        open={!!rejectReturnTarget}
        title="Reject return"
        message={`Reject the return request for order ${rejectReturnTarget?.orderNumber}? The order will stay delivered and the customer can request again.`}
        confirmLabel="Yes, reject return"
        hideIcon
        onConfirm={() => !actionBusy && confirmRejectReturn()}
        onCancel={() => {
          if (actionBusy) return;
          setRejectReturnTarget(null);
          setReturnRejectReason("");
        }}
      >
        <label className="mt-4 block">
          <span className="text-sm font-medium text-gray-700">
            Reason for rejection (required)
          </span>
          <textarea
            rows={2}
            value={returnRejectReason}
            onChange={(e) => setReturnRejectReason(e.target.value)}
            placeholder="Tell the customer why the return can't be accepted"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
          />
        </label>
      </ConfirmModal>

      <ConfirmModal
        open={!!receiveReturnedTarget}
        title="Receive returned items"
        message={`Confirm the returned items for order ${
          receiveReturnedTarget?.orderNumber
        } have reached the store. ${
          receiveReturnedTarget &&
          (receiveReturnedTarget.paymentStatus || "pending") === "paid"
            ? `A refund of ${returnAmount(
                receiveReturnedTarget
              )} can then be processed.`
            : "No payment was collected, so the return will close without a refund."
        }`}
        confirmLabel="Yes, receive items"
        tone="green"
        hideIcon
        onConfirm={() => !actionBusy && confirmReceiveReturnedItems()}
        onCancel={() => !actionBusy && setReceiveReturnedTarget(null)}
      >
        <div className="mt-4">
          <label className="flex items-start gap-3 rounded-md border border-gray-200 p-3">
            <input
              type="checkbox"
              checked={restockReturnedItems}
              onChange={(e) => setRestockReturnedItems(e.target.checked)}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-gray-900">
                Restock these items
              </span>
              <span className="block text-xs text-gray-600">
                Uncheck if they arrived damaged or can't be resold.
              </span>
            </span>
          </label>
          <p className="mt-2 text-xs text-gray-500">
            Only the returned quantities are added back to inventory.
          </p>
        </div>
      </ConfirmModal>

      <ConfirmModal
        open={!!refundTarget}
        title="Process refund"
        message={`Process a refund of ${
          refundTarget && isReturnRefund(refundTarget)
            ? returnAmount(refundTarget)
            : formatCurrency(refundTarget?.total)
        } for order ${refundTarget?.orderNumber}? This marks the refund as completed.`}
        confirmLabel="Yes, process refund"
        tone="green"
        onConfirm={confirmRefund}
        onCancel={() => !actionBusy && setRefundTarget(null)}
      />

      <ConfirmModal
        open={!!paidTarget}
        title="Mark cash collected"
        message={`Confirm cash payment of ${formatCurrency(paidTarget?.total)} has been collected for order ${paidTarget?.orderNumber}. This marks the order as paid.`}
        confirmLabel="Yes, mark as paid"
        tone="green"
        onConfirm={confirmMarkPaid}
        onCancel={() => !actionBusy && setPaidTarget(null)}
      />

      <ConfirmModal
        open={!!dispatchTarget}
        title="Dispatch replacement"
        message={`Send a new unit for order ${dispatchTarget?.orderNumber}? This takes a replacement unit out of stock. No payment is involved.`}
        confirmLabel="Yes, dispatch replacement"
        onConfirm={confirmDispatchReplacement}
        onCancel={() => !actionBusy && setDispatchTarget(null)}
      />

      <ConfirmModal
        open={!!completeTarget}
        title="Complete replacement"
        message={`Mark the replacement for order ${completeTarget?.orderNumber} as complete and restock the returned original unit?`}
        confirmLabel="Yes, complete replacement"
        tone="green"
        onConfirm={confirmCompleteReplacement}
        onCancel={() => !actionBusy && setCompleteTarget(null)}
      />
    </div>
  );
};

export default Orders;
