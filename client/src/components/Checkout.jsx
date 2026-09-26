


import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { CheckCircleIcon, TrashIcon } from "@heroicons/react/20/solid";
import { MapPinIcon, PlusIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import useAuth from "../customhooks/useAuth";
import { API_BASE_URL } from "../constants";
import { getCart, removeCartItem, updateCartQuantity } from "../utils/cart";























const deliveryMethods = [



  { id: 1, title: "Standard", turnaround: "4–10 business days", price: 5 },
  { id: 2, title: "Express", turnaround: "2–5 business days", price: 16 },
];

const TAX_RATE = 0.0863;

// Map an address type to a friendly chip label
const chipLabel = (type) =>
  type === "home" ? "Home" : type === "work" ? "Work" : "Other";

const Checkout = () => {
  const { isSignedIn, isLoaded, user } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [deliveryMethodId, setDeliveryMethodId] = useState(
    deliveryMethods[0].id,
  );

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

  const subtotal = cart?.subtotal || 0;
  const shipping = cartItems.length ? selectedDelivery.price : 0;
  const taxes = subtotal * TAX_RATE;
  const total = subtotal + shipping + taxes;

  const money = (value) => `$${value.toFixed(2)}`;

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEmailValid) {
      toast.error("Please enter a valid email address to place your order.");
      return;
    }
    if (!cartItems.length) {
      toast.error("Your cart is empty.");
      return;
    }
    setPlacingOrder(true);
    // Order persistence isn't wired to a backend endpoint yet; surface a
    // confirmation and send the shopper to their orders page.
    toast.success("Order placed successfully!");
    setPlacingOrder(false);
    navigate("/orders");
  };

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
                    Phone
                  </label>
                  <div className="mt-2">
                    <input
                      id="phone"
                      name="phone"
                      type="text"
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

                      aria-description={`${deliveryMethod.turnaround} for $${deliveryMethod.price}`}
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
                          ${deliveryMethod.price.toFixed(2)}
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
          </div>

          {/* Order summary */}
          <div className="mt-10 lg:mt-0">
            <h2 className="text-lg font-medium text-gray-900">Order summary</h2>

            <div className="mt-4 rounded-lg border border-gray-200 bg-white shadow-xs">
              <h3 className="sr-only">Items in your cart</h3>

















              {loading ? (
                <p className="px-4 py-10 text-sm text-gray-500 sm:px-6">
                  Loading your cart...
                </p>
              ) : cartItems.length === 0 ? (
                <p className="px-4 py-10 text-sm text-gray-500 sm:px-6">
                  Your cart is empty. Add some products before checking out.
                </p>
              ) : (
                <ul role="list" className="divide-y divide-gray-200">
                  {cartItems.map((item) => {
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
                            </div>
                          </div>






















                          <div className="flex flex-1 items-end justify-between pt-2">
                            <p className="mt-1 text-sm font-medium text-gray-900">
                              {money(product.price * item.quantity)}
                            </p>

                            <div className="ml-4">
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

                  disabled={placingOrder || !isEmailValid || !cartItems.length}
                  className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-xs hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {placingOrder ? "Placing order..." : "Confirm order"}
                </button>
                {!isEmailValid && (
                  <p className="mt-2 text-center text-xs text-gray-500">
                    Enter a valid email to place your order.
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
