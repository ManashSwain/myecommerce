import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  UserPlusIcon,
  UsersIcon,
  CheckCircleIcon,
  NoSymbolIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useAdminSession } from "../context/adminSession";
import {
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from "../utils/admins";
import FormModal from "./FormModal";
import ConfirmModal from "./ConfirmModal";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

const displayName = (admin) =>
  admin?.name || admin?.email?.split("@")[0] || "Admin";

const initials = (admin) =>
  displayName(admin).trim().charAt(0).toUpperCase() || "A";

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const StatCard = ({ label, value, sub, icon: Icon, tone = "blue" }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
        </div>
        {Icon && (
          <span className={`rounded-lg p-2 ${tones[tone] || tones.blue}`}>
            <Icon className="size-5" />
          </span>
        )}
      </div>
    </div>
  );
};

const Admins = () => {
  const { admin: me, token } = useAdminSession();

  const [admins, setAdmins] = useState([]);
  const [summary, setSummary] = useState({ total: 0, owners: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add-admin form
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", role: "admin" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Enable/disable + remove confirmations
  const [toggleTarget, setToggleTarget] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  const isOwner = me?.role === "owner";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAdmins(token);
      setAdmins(result.data || []);
      setSummary(
        result.summary || {
          total: result.data?.length || 0,
          owners: 0,
          active: 0,
        },
      );
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // Initial fetch on mount (and if the session token ever changes).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const openForm = () => {
    setForm({ email: "", name: "", role: "admin" });
    setFormError("");
    setFormOpen(true);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    const email = form.email.trim().toLowerCase();

    if (!isEmail(email)) {
      setFormError("Enter a valid email address.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      await createAdmin(token, {
        email,
        name: form.name.trim(),
        role: form.role,
      });
      toast.success(`${email} can now access the admin panel`);
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmToggle = async () => {
    if (!toggleTarget) return;
    setActionBusy(true);
    try {
      await updateAdmin(token, toggleTarget._id, {
        isActive: !toggleTarget.isActive,
      });
      toast.success(
        toggleTarget.isActive
          ? `${displayName(toggleTarget)} has been disabled`
          : `${displayName(toggleTarget)} can access the panel again`,
      );
      setToggleTarget(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setActionBusy(true);
    try {
      await deleteAdmin(token, removeTarget._id);
      toast.success(`${displayName(removeTarget)} no longer has admin access`);
      setRemoveTarget(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  // Regular admins can manage other regular admins; only owners can manage
  // owners. Nobody can action their own row.
  const canManage = (admin) =>
    !admin.isSelf && (admin.role !== "owner" || isOwner);

  return (
    <div className="py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Admins
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            People allowed to sign in to this panel
          </p>
        </div>
        <button
          type="button"
          onClick={openForm}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <UserPlusIcon className="size-5" />
          Add admin
        </button>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Admins"
          value={summary.total}
          sub="Everyone with panel access"
          icon={UsersIcon}
          tone="blue"
        />
        <StatCard
          label="Owners"
          value={summary.owners}
          sub="Can manage other owners"
          icon={ShieldCheckIcon}
          tone="amber"
        />
        <StatCard
          label="Active"
          value={summary.active}
          sub="Able to sign in right now"
          icon={CheckCircleIcon}
          tone="green"
        />
      </div>

      {/* How access works */}
      <div className="mt-6 flex gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <ShieldExclamationIcon className="mt-0.5 size-5 shrink-0" />
        <p>
          Access is decided by this list, not by the Auth0 sign-up page. Add the
          email someone uses with Auth0; anyone not listed here is denied when
          the panel checks their session. Disabling or removing a row takes
          effect on their next request. To block account creation entirely,
          also turn off sign-ups in your Auth0 tenant settings.
        </p>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* List */}
      {loading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-lg border border-gray-200 bg-gray-100"
            />
          ))}
        </div>
      ) : admins.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-gray-300 py-24 text-center">
          <p className="text-sm text-gray-500">
            No admins yet. Add the first one to get started.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {admins.map((admin) => {
            const manageable = canManage(admin);

            return (
              <div
                key={admin._id}
                className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                {/* Identity */}
                <div className="flex min-w-0 items-center gap-4">
                  {admin.picture ? (
                    <img
                      src={admin.picture}
                      alt={displayName(admin)}
                      className="size-12 shrink-0 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
                      {initials(admin)}
                    </span>
                  )}

                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
                      <span className="truncate">{displayName(admin)}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          admin.role === "owner"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {admin.role === "owner" ? "Owner" : "Admin"}
                      </span>
                      {admin.isSelf && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          You
                        </span>
                      )}
                      {!admin.isActive && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                          Disabled
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {admin.email}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {admin.isLinked
                        ? admin.lastLoginAt
                          ? `Last signed in ${formatDate(admin.lastLoginAt)}`
                          : "Signed in at least once"
                        : "Not signed in yet — access starts on their first login"}
                    </p>
                  </div>
                </div>

                {/* Metadata + actions */}
                <div className="flex flex-wrap items-center gap-x-8 gap-y-3 lg:justify-end">
                  <div>
                    <p className="text-xs text-gray-500">Added by</p>
                    <p className="max-w-40 truncate text-sm font-medium text-gray-900">
                      {admin.createdBy}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Added</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(admin.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setToggleTarget(admin)}
                      disabled={!manageable}
                      title={
                        manageable
                          ? undefined
                          : admin.isSelf
                            ? "You cannot change your own access"
                            : "Only an owner can manage another owner"
                      }
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
                        admin.isActive
                          ? "border border-red-300 text-red-700 hover:bg-red-50"
                          : "border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {admin.isActive ? (
                        <>
                          <NoSymbolIcon className="size-4" />
                          Disable
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="size-4" />
                          Enable
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setRemoveTarget(admin)}
                      disabled={!manageable}
                      title={
                        manageable
                          ? undefined
                          : admin.isSelf
                            ? "You cannot remove your own access"
                            : "Only an owner can remove another owner"
                      }
                      className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <TrashIcon className="size-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add admin */}
      <FormModal
        open={formOpen}
        title="Add admin"
        onClose={() => !saving && setFormOpen(false)}
      >
        <form onSubmit={submitForm} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              Email address
            </span>
            <input
              type="email"
              required
              autoFocus
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder="person@example.com"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="mt-1 block text-xs text-gray-500">
              They need an Auth0 account with this exact email. If sign-ups are
              disabled in Auth0, create their account in the Auth0 dashboard
              first. Any other account is denied by this list.
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              Name <span className="font-normal text-gray-400">(optional)</span>
            </span>
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Manash Swain"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>

          {isOwner && (
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Role</span>
              <select
                value={form.role}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    role: event.target.value,
                  }))
                }
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="admin">
                  Admin — can manage the store and other admins
                </option>
                <option value="owner">
                  Owner — can also manage owners
                </option>
              </select>
            </label>
          )}

          {formError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              disabled={saving}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <UserPlusIcon className="size-4" />
              {saving ? "Adding…" : "Add admin"}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Enable / disable confirmation */}
      <ConfirmModal
        open={!!toggleTarget}
        title={toggleTarget?.isActive ? "Disable admin" : "Enable admin"}
        message={
          toggleTarget?.isActive
            ? `Disable ${displayName(toggleTarget)}? They will lose access on their next request.`
            : `Enable ${displayName(toggleTarget)}? They will be able to sign in to the panel again.`
        }
        confirmLabel={
          toggleTarget?.isActive ? "Yes, disable" : "Yes, enable"
        }
        tone={toggleTarget?.isActive ? "red" : "green"}
        onConfirm={() => !actionBusy && confirmToggle()}
        onCancel={() => !actionBusy && setToggleTarget(null)}
      />

      {/* Remove confirmation */}
      <ConfirmModal
        open={!!removeTarget}
        title="Remove admin"
        message={`Remove ${displayName(removeTarget)}'s admin access? Their Auth0 account stays, but they will no longer be able to open the panel.`}
        confirmLabel="Yes, remove"
        onConfirm={() => !actionBusy && confirmRemove()}
        onCancel={() => !actionBusy && setRemoveTarget(null)}
      />
    </div>
  );
};

export default Admins;
