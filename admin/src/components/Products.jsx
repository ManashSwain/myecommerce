import React, { useRef, useState } from "react";
import { StarIcon } from "@heroicons/react/20/solid";
import { Pencil, Plus, Trash2 } from "lucide-react";
import FormModal from "./FormModal";

// TODO: fetch these from the categories/subcategories APIs once deployed
const categoryOptions = ["Wallets", "Stationery", "Sketchbooks", "Organizers"];
const subcategoryOptions = [
  "Long Wallets",
  "Pen Sets",
  "Mini Sketchbooks",
  "Desk Organizers",
];

// TODO: replace with data fetched from the products API once deployed
const sampleProducts = [
  {
    id: 1,
    title: "Organize Basic Set (Walnut)",
    description: "Beautiful walnut organizer set with multiple compartments.",
    price: 149,
    category: "Organizers",
    subcategory: "Desk Organizers",
    images: [
      "https://tailwindcss.com/plus-assets/img/ecommerce-images/category-page-05-image-card-01.jpg",
    ],
    slug: "organize-basic-set-walnut",
    rating: 5,
    color: "Walnut",
    size: "Medium",
    stock: 12,
    isFeatured: true,
  },
  {
    id: 2,
    title: "Organize Pen Holder",
    description: "Minimal pen holder for a tidy desk.",
    price: 15,
    category: "Stationery",
    subcategory: "Pen Sets",
    images: [
      "https://tailwindcss.com/plus-assets/img/ecommerce-images/category-page-05-image-card-02.jpg",
    ],
    slug: "organize-pen-holder",
    rating: 5,
    color: "Black",
    size: "Small",
    stock: 40,
    isFeatured: false,
  },
  {
    id: 3,
    title: "Organize Sticky Note Holder",
    description: "Sticky note holder in walnut finish.",
    price: 15,
    category: "Organizers",
    subcategory: "Desk Organizers",
    images: [
      "https://tailwindcss.com/plus-assets/img/ecommerce-images/category-page-05-image-card-03.jpg",
    ],
    slug: "organize-sticky-note-holder",
    rating: 5,
    color: "Walnut",
    size: "Small",
    stock: 25,
    isFeatured: false,
  },
  {
    id: 4,
    title: "Leather Key Ring (Black)",
    description: "Hand-stitched leather key ring.",
    price: 32,
    category: "Wallets",
    subcategory: "Long Wallets",
    images: [
      "https://tailwindcss.com/plus-assets/img/ecommerce-images/category-page-05-image-card-09.jpg",
    ],
    slug: "leather-key-ring-black",
    rating: 5,
    color: "Black",
    size: "One Size",
    stock: 60,
    isFeatured: true,
  },
];

const emptyForm = {
  title: "",
  description: "",
  price: "",
  category: "",
  subcategory: "",
  images: [],
  previews: [],
  slug: "",
  rating: 0,
  color: "",
  size: "",
  stock: "",
  isFeatured: false,
};

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Products = () => {
  const [products, setProducts] = useState(sampleProducts);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const slugTouched = useRef(false);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(false);
    slugTouched.current = false;
  };

  const openAddForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    slugTouched.current = false;
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: type === "checkbox" ? checked : value };
      // keep slug in sync with the title until the user edits it manually
      if (name === "title" && !slugTouched.current) {
        next.slug = slugify(value);
      }
      if (name === "slug") {
        slugTouched.current = true;
      }
      return next;
    });
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
      previews: [
        ...prev.previews,
        ...files.map((file) => URL.createObjectURL(file)),
      ],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      description: form.description,
      price: Number(form.price),
      category: form.category,
      subcategory: form.subcategory,
      images: form.previews,
      slug: form.slug,
      rating: Number(form.rating),
      color: form.color,
      size: form.size,
      stock: Number(form.stock),
      isFeatured: form.isFeatured,
    };

    if (editingId) {
      // TODO: call update API (PUT /products/:id) with payload once deployed
      setProducts((prev) =>
        prev.map((product) =>
          product.id === editingId
            ? {
                ...product,
                ...payload,
                images:
                  payload.images.length > 0 ? payload.images : product.images,
              }
            : product
        )
      );
    } else {
      // TODO: call create API (POST /products) with payload once deployed
      setProducts((prev) => [...prev, { id: Date.now(), ...payload }]);
    }
    resetForm();
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    slugTouched.current = true;
    setForm({
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      subcategory: product.subcategory,
      images: [],
      previews: product.images,
      slug: product.slug,
      rating: product.rating,
      color: product.color,
      size: product.size,
      stock: product.stock,
      isFeatured: product.isFeatured,
    });
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    // TODO: call delete API (DELETE /products/:id) once deployed
    setProducts((prev) => prev.filter((product) => product.id !== id));
  };

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Products
          </h2>
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            Add Product
          </button>
        </div>

        {/* Add / Edit modal */}
        <FormModal
          open={modalOpen}
          title={editingId ? "Edit Product" : "Add Product"}
          onClose={resetForm}
        >
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Product title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Slug
                </label>
                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="product-slug"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Price
                </label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Stock
                </label>
                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  required
                  min="0"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select category</option>
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Subcategory
                </label>
                <select
                  name="subcategory"
                  value={form.subcategory}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select subcategory</option>
                  {subcategoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Color
                </label>
                <input
                  type="text"
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. Black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Size
                </label>
                <input
                  type="text"
                  name="size"
                  value={form.size}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. M, L, XL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Rating
                </label>
                <input
                  type="number"
                  name="rating"
                  value={form.rating}
                  onChange={handleChange}
                  min="0"
                  max="5"
                  step="1"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={form.isFeatured}
                    onChange={handleChange}
                    className="size-4 rounded border-gray-300 accent-blue-600"
                  />
                  Featured product
                </label>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Images
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-600 hover:file:bg-blue-100"
                />
                {form.previews.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {form.previews.map((src, index) => (
                      <img
                        key={index}
                        src={src}
                        alt={`Preview ${index + 1}`}
                        className="h-20 w-20 rounded-md object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Product description"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {editingId ? "Update Product" : "Add Product"}
              </button>
            </div>
          </form>
        </FormModal>

        {/* Products grid */}
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8">
          {products.map((product) => (
            <div key={product.id} className="group relative">
              <div className="relative">
                <img
                  alt={product.title}
                  src={product.images[0]}
                  className="aspect-square w-full rounded-lg bg-gray-200 object-cover group-hover:opacity-75"
                />
                {product.isFeatured && (
                  <span className="absolute top-2 left-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                    Featured
                  </span>
                )}
              </div>
              <h3 className="mt-4 text-sm font-medium text-gray-900">
                {product.title}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {product.category} · {product.subcategory}
              </p>
              <div className="mt-2 flex items-center">
                {[0, 1, 2, 3, 4].map((rating) => (
                  <StarIcon
                    key={rating}
                    aria-hidden="true"
                    className={classNames(
                      product.rating > rating
                        ? "text-yellow-400"
                        : "text-gray-200",
                      "size-4 shrink-0"
                    )}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">
                  ${product.price}
                </p>
                <p
                  className={classNames(
                    product.stock > 0 ? "text-gray-500" : "text-red-600",
                    "text-xs"
                  )}
                >
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </p>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleEdit(product)}
                  className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                >
                  <Pencil size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="flex items-center gap-1 rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <p className="mt-6 text-sm text-gray-500">
            No products yet. Click "Add Product" to create one.
          </p>
        )}
      </div>
    </div>
  );
};

export default Products;
