import { useEffect, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  ChevronDownIcon,
  FunnelIcon,
  MinusIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";
import { Link } from "react-router";
import { toast } from "react-toastify";
import BackToHome from "../components/BackToHome";
import useAuth from "../customhooks/useAuth";
import { API_BASE_URL } from "../constants";

const sortOptions = [
  { id: "featured", name: "Featured" },
  { id: "newest", name: "Newest" },
  { id: "price-asc", name: "Price: Low to High" },
  { id: "price-desc", name: "Price: High to Low" },
];

// Sum of all variant stocks (falls back to legacy product.stock)
const totalStock = (product) =>
  (product.variants || []).reduce(
    (sum, variant) => sum + (variant.stock || 0),
    product.stock || 0
  );

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Shoppage = () => {
  const { isSignedIn, user } = useAuth();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [activeCategories, setActiveCategories] = useState([]);
  const [activeSubcategories, setActiveSubcategories] = useState([]);
  const [sortBy, setSortBy] = useState("featured");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [prodRes, catRes, subRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/products/getallproducts`),
          fetch(`${API_BASE_URL}/api/categories/getcategory`),
          fetch(`${API_BASE_URL}/api/subcategories/getsubcategory`),
        ]);
        const prodJson = await prodRes.json();
        const catJson = await catRes.json();
        const subJson = await subRes.json();
        const cats = catJson.data || [];
        const subs = subJson.data || [];
        setProducts(prodJson.data || []);
        setCategories(cats);
        setSubcategories(subs);
        // Everything checked by default
        setActiveCategories(cats.map((category) => category._id));
        setActiveSubcategories(subs.map((subcategory) => subcategory._id));
      } catch (err) {
        toast.error("Could not load the shop. Is the server running?");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const toggle = (value, list, setList) =>
    setList(
      list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value]
    );

  const visibleProducts = products
    .filter(
      (product) =>
        !product.category?._id || activeCategories.includes(product.category._id)
    )
    .filter(
      (product) =>
        !product.subcategory?._id ||
        activeSubcategories.includes(product.subcategory._id)
    )
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "newest")
        return new Date(b.createdAt) - new Date(a.createdAt);
      return Number(b.isFeatured) - Number(a.isFeatured); // featured
    });

  const handleAddToCart = async (product) => {
    if (!isSignedIn) {
      toast.error("Please sign in to add items to your bag.");
      return;
    }
    const variant = product.variants?.[0];
    if (!variant) {
      toast.error("This product has no available variants.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/cart/createcart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          productId: product._id,
          quantity: 1,
          color: variant.color,
          size: variant.size,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Could not add to bag");
      }
      toast.success("Added to bag!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filterSections = [
    {
      id: "category",
      name: "Category",
      options: categories,
      active: activeCategories,
      setActive: setActiveCategories,
    },
    {
      id: "subcategory",
      name: "Subcategory",
      options: subcategories,
      active: activeSubcategories,
      setActive: setActiveSubcategories,
    },
  ];

  const renderFilters = (idPrefix) =>
    filterSections.map((section) => (
      <Disclosure
        key={section.id}
        as="div"
        defaultOpen
        className="border-b border-gray-200 py-6"
      >
        <h3 className="-my-3 flow-root">
          <DisclosureButton className="group flex w-full items-center justify-between bg-white py-3 text-sm text-gray-400 hover:text-gray-500">
            <span className="font-medium text-gray-900">{section.name}</span>
            <span className="ml-6 flex items-center">
              <PlusIcon aria-hidden="true" className="size-5 group-data-open:hidden" />
              <MinusIcon aria-hidden="true" className="size-5 group-not-data-open:hidden" />
            </span>
          </DisclosureButton>
        </h3>
        <DisclosurePanel className="pt-6">
          <div className="space-y-4">
            {section.options.map((option) => (
              <div key={option._id} className="flex gap-3">
                <input
                  id={`${idPrefix}-${section.id}-${option._id}`}
                  type="checkbox"
                  checked={section.active.includes(option._id)}
                  onChange={() =>
                    toggle(option._id, section.active, section.setActive)
                  }
                  className="size-4 rounded-sm border-gray-300 accent-indigo-600"
                />
                <label
                  htmlFor={`${idPrefix}-${section.id}-${option._id}`}
                  className="text-sm text-gray-600"
                >
                  {option.name}
                </label>
              </div>
            ))}
          </div>
        </DisclosurePanel>
      </Disclosure>
    ));

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <BackToHome />
      </div>

      {/* Mobile filter dialog */}
      <Dialog
        open={mobileFiltersOpen}
        onClose={setMobileFiltersOpen}
        className="relative z-40 lg:hidden"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/25 transition-opacity duration-300 ease-linear data-closed:opacity-0"
        />
        <div className="fixed inset-0 z-40 flex">
          <DialogPanel
            transition
            className="relative ml-auto flex size-full max-w-xs transform flex-col overflow-y-auto bg-white pt-4 pb-6 shadow-xl transition duration-300 ease-in-out data-closed:translate-x-full"
          >
            <div className="flex items-center justify-between px-4">
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="relative -mr-2 flex size-10 items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-50"
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon aria-hidden="true" className="size-6" />
              </button>
            </div>
            <form className="mt-4 border-t border-gray-200 px-4">
              {renderFilters("filter-mobile")}
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-baseline justify-between border-b border-gray-200 pt-6 pb-6">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Shop
          </h1>

          <div className="flex items-center">
            <Menu as="div" className="relative inline-block text-left">
              <MenuButton className="group inline-flex justify-center text-sm font-medium text-gray-700 hover:text-gray-900">
                Sort: {sortOptions.find((option) => option.id === sortBy)?.name}
                <ChevronDownIcon
                  aria-hidden="true"
                  className="-mr-1 ml-1 size-5 shrink-0 text-gray-400 group-hover:text-gray-500"
                />
              </MenuButton>
              <MenuItems
                transition
                className="absolute right-0 z-10 mt-2 w-44 origin-top-right rounded-md bg-white shadow-2xl ring-1 ring-black/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
              >
                <div className="py-1">
                  {sortOptions.map((option) => (
                    <MenuItem key={option.id}>
                      <button
                        onClick={() => setSortBy(option.id)}
                        className={classNames(
                          option.id === sortBy
                            ? "font-medium text-gray-900"
                            : "text-gray-500",
                          "block w-full px-4 py-2 text-left text-sm data-focus:bg-gray-100 data-focus:outline-hidden"
                        )}
                      >
                        {option.name}
                      </button>
                    </MenuItem>
                  ))}
                </div>
              </MenuItems>
            </Menu>

            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="-m-2 ml-4 p-2 text-gray-400 hover:text-gray-500 sm:ml-6 lg:hidden"
            >
              <span className="sr-only">Filters</span>
              <FunnelIcon aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>

        <section aria-labelledby="products-heading" className="pt-6 pb-24">
          <h2 id="products-heading" className="sr-only">
            Products
          </h2>

          <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
            {/* Sidebar filters */}
            <form className="hidden lg:block">{renderFilters("filter")}</form>

            {/* Product grid */}
            <div className="lg:col-span-3">
              {loading ? (
                <p className="text-sm text-gray-500">Loading products...</p>
              ) : visibleProducts.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No products match the selected filters.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
                  {visibleProducts.map((product) => (
                    <div key={product._id} className="group relative">
                      <Link to={`/product/${product._id}`}>
                        {product.images?.[0] && (
                          <img
                            alt={product.title}
                            src={product.images[0]}
                            className="aspect-square w-full rounded-md bg-gray-200 object-cover group-hover:opacity-75 lg:aspect-auto lg:h-80"
                          />
                        )}
                      </Link>
                      <div className="mt-4 flex justify-between">
                        <div>
                          <h3 className="text-sm text-gray-700">
                            <Link to={`/product/${product._id}`}>
                              {product.title}
                            </Link>
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {product.category?.name} ·{" "}
                            {product.subcategory?.name}
                          </p>
                          <p
                            className={classNames(
                              totalStock(product) > 0
                                ? "text-gray-500"
                                : "text-red-600",
                              "mt-1 text-xs"
                            )}
                          >
                            {totalStock(product) > 0
                              ? `${totalStock(product)} in stock`
                              : "Out of stock"}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          ${product.price}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        className="mt-3 w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Shoppage;
