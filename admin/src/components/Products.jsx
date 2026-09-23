import React, { useEffect, useRef, useState } from "react";
import { StarIcon } from "@heroicons/react/20/solid";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import FormModal from "./FormModal";
import ConfirmModal from "./ConfirmModal";
import { API_BASE_URL } from "../constants";

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
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState("");
  const slugTouched = useRef(false);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/getallproducts`);
      const json = await res.json();
      setProducts(json.data || []);
    } catch (err) {
      setError("Could not load products. Is the server running?");
    }
  };

  // Categories and subcategories feed the form's select dropdowns
  const fetchOptions = async () => {
    try {
      const [catRes, subRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/categories/getcategory`),
        fetch(`${API_BASE_URL}/api/subcategories/getsubcategory`),
      ]);
      const catJson = await catRes.json();
      const subJson = await subRes.json();
      setCategories(catJson.data || []);
      setSubcategories(subJson.data || []);
    } catch (err) {
      setError("Could not load categories and subcategories.");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchOptions();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(false);
    setError("");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    // Multipart form: image files travel with the text fields, the server
    // uploads them to Cloudinary and stores only the URLs.
    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("price", form.price);
    formData.append("category", form.category);
    formData.append("subcategory", form.subcategory);
    formData.append("slug", form.slug);
    formData.append("rating", form.rating);
    formData.append("color", form.color);
    formData.append("size", form.size);
    formData.append("stock", form.stock);
    formData.append("isFeatured", form.isFeatured);
    form.images.forEach((file) => formData.append("images", file));

    try {
      const url = editingId
        ? `${API_BASE_URL}/api/products/updateproduct/${editingId}`
        : `${API_BASE_URL}/api/products/createproduct`;
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Request failed");
      }
      toast.success(
        editingId
          ? "Product updated successfully!"
          : "Product created successfully!"
      );
      await fetchProducts();
      resetForm();
    } catch (err) {
      setError(err.message);
      toast.error(
        `Failed to ${editingId ? "update" : "create"} product: ${err.message}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    slugTouched.current = true;
    setForm({
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category?._id || product.category || "",
      subcategory: product.subcategory?._id || product.subcategory || "",
      images: [],
      previews: product.images || [],
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
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    const id = deleteTarget;
    setDeleteTarget(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/products/deleteproduct/${id}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Delete failed");
      }
      toast.success("Product deleted successfully!");
      setProducts((prev) => prev.filter((product) => product._id !== id));
    } catch (err) {
      setError(err.message);
      toast.error(`Failed to delete product: ${err.message}`);
    }
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

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

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
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
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
                  {subcategories.map((subcategory) => (
                    <option key={subcategory._id} value={subcategory._id}>
                      {subcategory.name}
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
                disabled={submitting}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting
                  ? "Saving..."
                  : editingId
                    ? "Update Product"
                    : "Add Product"}
              </button>
            </div>
          </form>
        </FormModal>

        {/* Delete confirmation modal */}
        <ConfirmModal
          open={deleteTarget !== null}
          title="Delete Product"
          message="Are you sure you want to delete this product? This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />

        {/* Products grid */}
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8">
          {products.map((product) => (
            <div key={product._id} className="group relative">
              <div className="relative">
                {product.images?.[0] && (
                  <img
                    alt={product.title}
                    src={product.images[0]}
                    className="aspect-square w-full rounded-lg bg-gray-200 object-cover group-hover:opacity-75"
                  />
                )}
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
                {product.category?.name || product.category} ·{" "}
                {product.subcategory?.name || product.subcategory}
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
                  onClick={() => handleDelete(product._id)}
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
