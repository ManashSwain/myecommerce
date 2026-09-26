import { useEffect, useMemo, useState } from "react";
import { ChevronDownIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { toast } from "react-toastify";
import { getAllOrders, updateOrderStatus } from "../utils/order";

const STATUS_OPTIONS = ["placed", "processing", "shipped", "delivered"];

// Colours for the status pill
const statusStyles = {
  placed: "bg-gray-100 text-gray-700",
  processing: "bg-amber-100 text-amber-700",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
};

const statusLabel = (status) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : "Placed";

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

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
    STATUS_OPTIONS.forEach((status) => {
      base[status] = orders.filter((o) => o.status === status).length;
    });
    return base;
  }, [orders]);

  // Collapse any open accordion when the page changes
  const goToPage = (next) => {
    setPage(Math.min(Math.max(1, next), totalPages));
    setOpenId(null);
  };

  const handleStatusChange = async (orderId, status) => {
    const previous = orders;
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o._id === orderId ? { ...o, status } : o))
    );
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, status);
      toast.success(`Order marked as ${status}`);
    } catch (err) {
      setOrders(previous); // rollback
      toast.error(err.message);
    } finally {
      setUpdatingId(null);
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
        {["all", ...STATUS_OPTIONS].map((status) => (
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
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {order.orderNumber}
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
                      ${order.total.toFixed(2)}
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
                                ${(item.price * item.quantity).toFixed(2)}
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
                              <dd>${order.subtotal.toFixed(2)}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt>Shipping</dt>
                              <dd>${order.shipping.toFixed(2)}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt>Taxes</dt>
                              <dd>${order.taxes.toFixed(2)}</dd>
                            </div>
                            <div className="flex justify-between border-t border-gray-200 pt-1 font-medium text-gray-900">
                              <dt>Total</dt>
                              <dd>${order.total.toFixed(2)}</dd>
                            </div>
                          </dl>
                          <p className="mt-2 text-xs text-gray-500">
                            {order.deliveryMethod} delivery ·{" "}
                            {order.contactEmail}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-900">
                            Update status
                          </label>
                          <select
                            value={order.status}
                            disabled={updatingId === order._id}
                            onChange={(e) =>
                              handleStatusChange(order._id, e.target.value)
                            }
                            className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {statusLabel(status)}
                              </option>
                            ))}
                          </select>
                          {updatingId === order._id && (
                            <p className="mt-1 text-xs text-gray-500">
                              Saving...
                            </p>
                          )}
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
    </div>
  );
};

export default Orders;
