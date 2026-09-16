import React, { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";

const emptyForm = { name: "", description: "", image: null, preview: "" };

const CategoryManager = ({ title, singular, initialItems }) => {
  const [items, setItems] = useState(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const openAddForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      // TODO: call update API (PUT /:id) with { name, description, image } once deployed
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                name: form.name,
                description: form.description,
                image: form.preview || item.image,
              }
            : item
        )
      );
    } else {
      // TODO: call create API (POST /) with { name, description, image } once deployed
      setItems((prev) => [
        ...prev,
        {
          id: Date.now(),
          name: form.name,
          description: form.description,
          image: form.preview,
        },
      ]);
    }
    resetForm();
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      image: null,
      preview: item.image,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    if (!window.confirm(`Are you sure you want to delete this ${singular}?`))
      return;
    // TODO: call delete API (DELETE /:id) once deployed
    setItems((prev) => prev.filter((item) => item.id !== id));
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

        {/* Add / Edit form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {editingId ? `Edit ${singular}` : `Add ${singular}`}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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

            <div className="mt-4 flex gap-3">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {editingId ? `Update ${singular}` : `Add ${singular}`}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Items grid */}
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-4 lg:gap-x-8">
          {items.map((item) => (
            <div key={item.id} className="group relative">
              <div className="h-56 w-full overflow-hidden rounded-md bg-gray-200 lg:h-72 xl:h-80">
                <img
                  alt={item.name}
                  src={item.image}
                  className="size-full object-cover group-hover:opacity-75"
                />
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
                  onClick={() => handleDelete(item.id)}
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
