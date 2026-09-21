import { useState } from "react";
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

// TODO: fetch products, categories and subcategories from the backend
const categoryOptions = ["Women", "Men", "Kids"];
const subcategoryOptions = ["Tops", "Jeans", "Dresses", "Shirts"];

const sortOptions = [
  { id: "featured", name: "Featured" },
  { id: "newest", name: "Newest" },
  { id: "price-asc", name: "Price: Low to High" },
  { id: "price-desc", name: "Price: High to Low" },
];

const products = [
  {
    id: 1,
    name: "Basic Tee",
    price: 35,
    category: "Men",
    subcategory: "Tops",
    isFeatured: true,
    imageSrc:
      "https://tailwindcss.com/plus-assets/img/ecommerce-images/product-page-01-related-product-01.jpg",
    imageAlt: "Front of men's Basic Tee in black.",
  },
  {
    id: 2,
    name: "Aspen White Tee",
    price: 32,
    category: "Women",
    subcategory: "Tops",
    isFeatured: false,
    imageSrc:
      "https://tailwindcss.com/plus-assets/img/ecommerce-images/product-page-01-related-product-02.jpg",
    imageAlt: "Front of Basic Tee in white.",
  },
  {
    id: 3,
    name: "Charcoal Tee",
    price: 38,
    category: "Men",
    subcategory: "Shirts",
    isFeatured: false,
    imageSrc:
      "https://tailwindcss.com/plus-assets/img/ecommerce-images/product-page-01-related-product-03.jpg",
    imageAlt: "Front of Basic Tee in dark gray.",
  },
  {
    id: 4,
    name: "Artwork Tee",
    price: 45,
    category: "Kids",
    subcategory: "Tops",
    isFeatured: true,
    imageSrc:
      "https://tailwindcss.com/plus-assets/img/ecommerce-images/product-page-01-related-product-04.jpg",
    imageAlt: "Front of Artwork Tee in peach.",
  },
  {
    id: 5,
    name: "Organize Basic Set",
    price: 149,
    category: "Women",
    subcategory: "Dresses",
    isFeatured: false,
    imageSrc:
      "https://tailwindcss.com/plus-assets/img/ecommerce-images/category-page-05-image-card-01.jpg",
    imageAlt: "Walnut organizer set.",
  },
  {
    id: 6,
    name: "Slim Fit Jeans",
    price: 89,
    category: "Men",
    subcategory: "Jeans",
    isFeatured: true,
    imageSrc:
      "https://tailwindcss.com/plus-assets/img/ecommerce-images/category-page-05-image-card-02.jpg",
    imageAlt: "Slim fit jeans.",
  },
  {
    id: 7,
    name: "Summer Dress",
    price: 120,
    category: "Women",
    subcategory: "Dresses",
    isFeatured: false,
    imageSrc:
      "https://tailwindcss.com/plus-assets/img/ecommerce-images/category-page-05-image-card-03.jpg",
    imageAlt: "Summer dress.",
  },
  {
    id: 8,
    name: "Kids Denim",
    price: 55,
    category: "Kids",
    subcategory: "Jeans",
    isFeatured: false,
    imageSrc:
      "https://tailwindcss.com/plus-assets/img/ecommerce-images/category-page-05-image-card-09.jpg",
    imageAlt: "Kids denim.",
  },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Shoppage = () => {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [activeCategories, setActiveCategories] = useState([]);
  const [activeSubcategories, setActiveSubcategories] = useState([]);
  const [sortBy, setSortBy] = useState("featured");

  const toggle = (value, list, setList) =>
    setList(
      list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value]
    );

  const visibleProducts = products
    .filter(
      (product) =>
        activeCategories.length === 0 ||
        activeCategories.includes(product.category)
    )
    .filter(
      (product) =>
        activeSubcategories.length === 0 ||
        activeSubcategories.includes(product.subcategory)
    )
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "newest") return b.id - a.id;
      return Number(b.isFeatured) - Number(a.isFeatured); // featured
    });

  const filterSections = [
    {
      id: "category",
      name: "Category",
      options: categoryOptions,
      active: activeCategories,
      setActive: setActiveCategories,
    },
    {
      id: "subcategory",
      name: "Subcategory",
      options: subcategoryOptions,
      active: activeSubcategories,
      setActive: setActiveSubcategories,
    },
  ];

  const renderFilters = (idPrefix) =>
    filterSections.map((section) => (
      <Disclosure
        key={section.id}
        as="div"
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
              <div key={option} className="flex gap-3">
                <input
                  id={`${idPrefix}-${section.id}-${option}`}
                  type="checkbox"
                  checked={section.active.includes(option)}
                  onChange={() => toggle(option, section.active, section.setActive)}
                  className="size-4 rounded-sm border-gray-300 accent-indigo-600"
                />
                <label
                  htmlFor={`${idPrefix}-${section.id}-${option}`}
                  className="text-sm text-gray-600"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        </DisclosurePanel>
      </Disclosure>
    ));

  return (
    <div className="bg-white">
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
        <div className="flex items-baseline justify-between border-b border-gray-200 pt-24 pb-6">
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
            <form className="hidden lg:block">
              {renderFilters("filter")}
            </form>

            {/* Product grid */}
            <div className="lg:col-span-3">
              {visibleProducts.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No products match the selected filters.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
                  {visibleProducts.map((product) => (
                    <div key={product.id} className="group relative">
                      <Link to={`/product/${product.id}`}>
                        <img
                          alt={product.imageAlt}
                          src={product.imageSrc}
                          className="aspect-square w-full rounded-md bg-gray-200 object-cover group-hover:opacity-75 lg:aspect-auto lg:h-80"
                        />
                      </Link>
                      <div className="mt-4 flex justify-between">
                        <div>
                          <h3 className="text-sm text-gray-700">
                            <Link to={`/product/${product.id}`}>
                              {product.name}
                            </Link>
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {product.category} · {product.subcategory}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          ${product.price}
                        </p>
                      </div>
                      {/* TODO: wire to the cart API once real products load from the backend */}
                      <button
                        type="button"
                        onClick={() => toast.success("Added to bag!")}
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
