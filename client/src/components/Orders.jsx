import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../customhooks/useAuth";
import BackToHome from "./BackToHome";
import { getOrders } from "../utils/order";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

// Ordered tracking steps — index matches the statusStep() value below.
const STEPS = ["Order placed", "Processing", "Shipped", "Delivered"];

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

const statusLabel = (status) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : "Placed";

const Orders = () => {
  const { isSignedIn, isLoaded, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (!isLoaded) return null;

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
          <p className="mt-10 text-sm text-gray-500">Loading your orders...</p>
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
                    <p className="text-base font-medium text-gray-900">
                      ${order.total.toFixed(2)}
                    </p>
                  </div>

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
                                  ${(item.price * item.quantity).toFixed(2)}
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
                    <h4 className="sr-only">Status</h4>
                    <p className="text-sm font-medium text-gray-900">
                      {statusLabel(order.status)}
                    </p>
                    <div aria-hidden="true" className="mt-6">
                      {/*
                        The track and its 4 labels share the same 4 anchor
                        points (0%, 33.3%, 66.6%, 100%) so the fill always ends
                        exactly under the active label. `justify-between` puts
                        the first label at the left edge and the last at the
                        right edge, matching the fill's start/end.
                      */}
                      <div className="relative">
                        <div className="overflow-hidden rounded-full bg-gray-200">
                          <div
                            style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
