import React, { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import FormModal from "./FormModal";
import { API_BASE_URL } from "../constants";

const emptyForm = { name: "", description: "", image: null, preview: "" };

// Generic manager for category-like resources. `endpoints` provides the
// API paths: { getAll, create, update(id), remove(id) } relative to API_BASE_URL.
const CategoryManager = ({ title, singular, endpoints }) => {
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoints.getAll}`);
      const json = await res.json();
      setItems(json.data || []);
    } catch (err) {
      setError(`Could not load ${title.toLowerCase()}. Is the server running?`);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(false);
    setError("");
  };

  const openAddForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm((prev) => ({
      ...prev,
      image: file,
      preview: URL.createObjectURL(file),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    // Multipart form so the image file travels with the text fields;
    // the server uploads it to Cloudinary and stores only the URL.
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    if (form.image) {
      formData.append("image", form.image);
    }

    try {
      const url = editingId
        ? `${API_BASE_URL}${endpoints.update(editingId)}`
        : `${API_BASE_URL}${endpoints.create}`;
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
          ? `${singular} updated successfully!`
          : `${singular} created successfully!`
      );
      await fetchItems();
      resetForm();
    } catch (err) {
      setError(err.message);
      toast.error(
        `Failed to ${editingId ? "update" : "create"} ${singular.toLowerCase()}: ${err.message}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      name: item.name,
      description: item.description,
      image: null,
      preview: item.image?.[0] || "",
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoints.remove(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Delete failed");
      }
      toast.success(`${singular} deleted successfully!`);
      setItems((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setError(err.message);
      toast.error(`Failed to delete ${singular.toLowerCase()}: ${err.message}`);
    }
  };

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {title}
          </h2>
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            Add {singular}
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
          title={editingId ? `Edit ${singular}` : `Add ${singular}`}
          onClose={resetForm}
        >
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder={`${singular} name`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-600 hover:file:bg-blue-100"
                />
                {form.preview && (
                  <img
                    src={form.preview}
                    alt="Preview"
                    className="mt-2 h-20 w-20 rounded-md object-cover"
                  />
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
                  placeholder={`${singular} description`}
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
                    ? `Update ${singular}`
                    : `Add ${singular}`}
              </button>
            </div>
          </form>
        </FormModal>

        {/* Items grid */}
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-4 lg:gap-x-8">
          {items.map((item) => (
            <div key={item._id} className="group relative">
              <div className="h-56 w-full overflow-hidden rounded-md bg-gray-200 lg:h-72 xl:h-80">
                {item.image?.[0] && (
                  <img
                    alt={item.name}
                    src={item.image[0]}
                    className="size-full object-cover group-hover:opacity-75"
                  />
                )}
              </div>
              <h3 className="mt-4 text-sm font-medium text-gray-900">
                {item.name}
              </h3>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                {item.description}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                >
                  <Pencil size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="flex items-center gap-1 rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <p className="mt-6 text-sm text-gray-500">
            No {title.toLowerCase()} yet. Click "Add {singular}" to create one.
          </p>
        )}
      </div>
    </div>
  );
};

export default CategoryManager;
