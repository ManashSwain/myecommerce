import { useEffect, useState } from "react";
import { MapPinIcon, PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import useAuth from "../customhooks/useAuth";
import FormModal from "../components/FormModal";
import BackToHome from "../components/BackToHome";
import { API_BASE_URL } from "../constants";

const emptyForm = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  country: "",
  state: "",
  district: "",
  city: "",
  pincode: "",
  landmark: "",
  addressType: "home",
};

const Savedaddressespage = () => {
  const { isSignedIn, isLoaded, user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // The backend returns all addresses; keep only the signed-in user's
  const fetchAddresses = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/address/getalladdress`);
      const json = await res.json();
      const mine = (json.data || []).filter(
        (address) => address.clerkId === user?.id
      );
      setAddresses(mine);
    } catch (err) {
      toast.error("Could not load addresses. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchAddresses();
    } else {
      setLoading(false);
    }
  }, [isSignedIn, user?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingId
        ? `${API_BASE_URL}/api/address/updateaddress/${editingId}`
        : `${API_BASE_URL}/api/address/addaddress`;
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, clerkId: user.id }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Request failed");
      }
      toast.success(
        editingId
          ? "Address updated successfully!"
          : "Address added successfully!"
      );
      await fetchAddresses();
      resetForm();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (address) => {
    setEditingId(address._id);
    setForm({
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      country: address.country,
      state: address.state,
      district: address.district,
      city: address.city,
      pincode: address.pincode,
      landmark: address.landmark,
      addressType: address.addressType,
    });
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/address/deleteaddress/${id}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Delete failed");
      }
      toast.success("Address deleted successfully!");
      setAddresses((prev) => prev.filter((address) => address._id !== id));
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <p className="text-sm text-gray-500">
            Please sign in to manage your saved addresses.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mb-8"><BackToHome /></div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Saved addresses
          </h2>
          <button
            onClick={() => {
              setForm(emptyForm);
              setEditingId(null);
              setFormOpen(true);
            }}
            className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <PlusIcon aria-hidden="true" className="size-4" />
            Add address
          </button>
        </div>

        {/* Add / Edit modal */}
        <FormModal
          open={formOpen}
          title={editingId ? "Edit address" : "New address"}
          onClose={resetForm}
        >
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full name</label>
                <input type="text" name="fullName" value={form.fullName} onChange={handleChange} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address line 1</label>
                <input type="text" name="addressLine1" value={form.addressLine1} onChange={handleChange} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address line 2 (optional)</label>
                <input type="text" name="addressLine2" value={form.addressLine2} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input type="text" name="city" value={form.city} onChange={handleChange} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">District</label>
                <input type="text" name="district" value={form.district} onChange={handleChange} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <input type="text" name="state" value={form.state} onChange={handleChange} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <input type="text" name="country" value={form.country} onChange={handleChange} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Pincode</label>
                <input type="text" name="pincode" value={form.pincode} onChange={handleChange} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Landmark</label>
                <input type="text" name="landmark" value={form.landmark} onChange={handleChange} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address type</label>
                <select name="addressType" value={form.addressType} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </select>
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
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting
                  ? "Saving..."
                  : editingId
                    ? "Update address"
                    : "Save address"}
              </button>
            </div>
          </form>
        </FormModal>

        {/* Address list */}
        {loading ? (
          <p className="mt-10 text-sm text-gray-500">Loading addresses...</p>
        ) : addresses.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-24 text-center">
            <MapPinIcon aria-hidden="true" className="size-10 text-gray-300" />
            <p className="mt-4 text-sm text-gray-500">
              No saved addresses yet. Click "Add address" to create one.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {addresses.map((address) => (
              <div
                key={address._id}
                className="rounded-lg border border-gray-200 p-5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {address.fullName}
                  </h3>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 capitalize">
                    {address.addressType}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {address.addressLine1}
                  {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {address.city}, {address.district}, {address.state} - {address.pincode}
                </p>
                <p className="mt-1 text-sm text-gray-600">{address.country}</p>
                <p className="mt-1 text-sm text-gray-500">
                  Landmark: {address.landmark}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Phone: {address.phone}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(address)}
                    className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <PencilIcon aria-hidden="true" className="size-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(address._id)}
                    className="flex items-center gap-1 rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <TrashIcon aria-hidden="true" className="size-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Savedaddressespage;
