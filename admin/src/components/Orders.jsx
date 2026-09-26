import { useEffect, useMemo, useState } from "react";
import { ChevronDownIcon, UserCircleIcon } from "@heroicons/react/24/outline";
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

  // Apply the status filter locally so the counts stay accurate
  const visibleOrders = useMemo(
    () =>
      filter === "all"
        ? orders
        : orders.filter((order) => order.status === filter),
    [orders, filter]
  );

  const counts = useMemo(() => {
    const base = { all: orders.length };
    STATUS_OPTIONS.forEach((status) => {
      base[status] = orders.filter((o) => o.status === status).length;
    });
    return base;
  }, [orders]);

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
            onClick={() => setFilter(status)}
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

      {loading ? (
        <p className="mt-10 text-sm text-gray-500">Loading orders...</p>
      ) : visibleOrders.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-gray-300 py-24 text-center">
          <p className="text-sm text-gray-500">No orders found.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {visibleOrders.map((order) => {
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
      )}
    </div>
  );
};

export default Orders;
