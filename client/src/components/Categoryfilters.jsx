import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { ArrowLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FunnelIcon, MinusIcon, PlusIcon } from "@heroicons/react/20/solid";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../constants";

const slugify = (text) =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

// Sum of all variant stocks (falls back to legacy product.stock)
const totalStock = (product) =>
  (product.variants || []).reduce(
    (sum, variant) => sum + (variant.stock || 0),
    0,
  );

const Categoryfilters = () => {
  const { categoryname } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Selected filter values
  const [activeSubcategories, setActiveSubcategories] = useState([]);
  const [activeColors, setActiveColors] = useState([]);
  const [activeSizes, setActiveSizes] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/products/getallproducts`),
          fetch(`${API_BASE_URL}/api/categories/getcategory`),
        ]);
        const prodJson = await prodRes.json();
        const catJson = await catRes.json();
        setProducts(prodJson.data || []);
        setCategories(catJson.data || []);
      } catch (err) {
        toast.error("Could not load products for this category.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Reset filters whenever the category in the URL changes
  useEffect(() => {
    setActiveSubcategories([]);
    setActiveColors([]);
    setActiveSizes([]);
  }, [categoryname]);

  // Resolve the category document from the slug in the URL
  const category = useMemo(
    () => categories.find((cat) => slugify(cat.name) === categoryname),
    [categories, categoryname],
  );

  // Products belonging to this category
  const categoryProducts = useMemo(() => {
    if (!category) return [];
    return products.filter(
      (product) => product.category?._id === category._id,
    );
  }, [products, category]);

  // Build the filter option lists from the products in this category
  const subcategoryOptions = useMemo(() => {
    const map = new Map();
    categoryProducts.forEach((product) => {
      if (product.subcategory?._id) {
        map.set(product.subcategory._id, product.subcategory.name);
      }
    });
    return [...map.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [categoryProducts]);

  const colorOptions = useMemo(() => {
    const set = new Set();
    categoryProducts.forEach((product) =>
      (product.variants || []).forEach((variant) => {
        if (variant.color) set.add(variant.color);
      }),
    );
    return [...set].sort((a, b) => a.localeCompare(b)).map((c) => ({ value: c, label: c }));
  }, [categoryProducts]);

  const sizeOptions = useMemo(() => {
    const set = new Set();
    categoryProducts.forEach((product) =>
      (product.variants || []).forEach((variant) => {
        if (variant.size) set.add(variant.size);
      }),
    );
    return [...set].sort((a, b) => a.localeCompare(b)).map((s) => ({ value: s, label: s }));
  }, [categoryProducts]);

  const toggle = (value, list, setList) =>
    setList(
      list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value],
    );

  // Apply the checked filters to the products
  const visibleProducts = categoryProducts.filter((product) => {
    if (
      activeSubcategories.length > 0 &&
      !activeSubcategories.includes(product.subcategory?._id)
    ) {
      return false;
    }

    const variants = product.variants || [];

    // Color and size are matched against the same variant when both are
    // selected, so e.g. Green + L only matches a variant that is Green/L.
    if (activeColors.length > 0 && activeSizes.length > 0) {
      return variants.some(
        (variant) =>
          activeColors.includes(variant.color) &&
          activeSizes.includes(variant.size),
      );
    }
    if (
      activeColors.length > 0 &&
      !variants.some((variant) => activeColors.includes(variant.color))
    ) {
      return false;
    }
    if (
      activeSizes.length > 0 &&
      !variants.some((variant) => activeSizes.includes(variant.size))
    ) {
      return false;
    }
    return true;
  });

  // Convenience lists reused across the desktop + mobile filter panels
  const filterSections = [
    {
      id: "subcategory",
      name: "Subcategory",
      options: subcategoryOptions,
      active: activeSubcategories,
      setActive: setActiveSubcategories,
    },
    {
      id: "color",
      name: "Color",
      options: colorOptions,
      active: activeColors,
      setActive: setActiveColors,
    },
    {
      id: "size",
      name: "Size",
      options: sizeOptions,
      active: activeSizes,
      setActive: setActiveSizes,
    },
  ];

  const categoryTitle = category?.name || "Products";

  const renderFilters = (idPrefix) => (
    <>
      {filterSections.map((section) => (
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
                <PlusIcon
                  aria-hidden="true"
                  className="size-5 group-data-open:hidden"
                />
                <MinusIcon
                  aria-hidden="true"
                  className="size-5 group-not-data-open:hidden"
                />
              </span>
            </DisclosureButton>
          </h3>
          <DisclosurePanel className="pt-6">
            <div className="space-y-4">
              {section.options.length === 0 ? (
                <p className="text-sm text-gray-400">No options</p>
              ) : (
                section.options.map((option) => (
                  <div key={option.value} className="flex gap-3">
                    <input
                      id={`${idPrefix}-${section.id}-${option.value}`}
                      type="checkbox"
                      checked={section.active.includes(option.value)}
                      onChange={() =>
                        toggle(option.value, section.active, section.setActive)
                      }
                      className="size-4 rounded-sm border-gray-300 accent-indigo-600"
                    />
                    <label
                      htmlFor={`${idPrefix}-${section.id}-${option.value}`}
                      className="text-sm text-gray-600"
                    >
                      {option.label}
                    </label>
                  </div>
                ))
              )}
            </div>
          </DisclosurePanel>
        </Disclosure>
      ))}
    </>
  );

  return (
    <div className="bg-white">
      <div>
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
          <div className="pt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              <ArrowLeftIcon aria-hidden="true" className="size-4" />
              Back
            </button>
          </div>
          <div className="flex items-baseline justify-between border-b border-gray-200 pt-6 pb-6">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              {categoryTitle}
            </h1>

            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="-m-2 ml-4 p-2 text-gray-400 hover:text-gray-500 sm:ml-6 lg:hidden"
            >
              <span className="sr-only">Filters</span>
              <FunnelIcon aria-hidden="true" className="size-5" />
            </button>
          </div>

          <section aria-labelledby="products-heading" className="pt-6 pb-24">
            <h2 id="products-heading" className="sr-only">
              Products
            </h2>

            <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
              {/* Sidebar filters */}
              <form className="hidden lg:block">
                {renderFilters("filter")}
              </form>

              {/* Product grid */}
              <div className="lg:col-span-3">
                {loading ? (
                  <p className="text-sm text-gray-500">Loading products...</p>
                ) : !category ? (
                  <p className="text-sm text-gray-500">
                    This category could not be found.
                  </p>
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
                              {product.subcategory?.name}
                            </p>
                            <p
                              className={
                                totalStock(product) > 0
                                  ? "mt-1 text-xs text-gray-500"
                                  : "mt-1 text-xs text-red-600"
                              }
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Categoryfilters;
