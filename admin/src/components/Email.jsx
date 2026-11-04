import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  CheckCircle2,
  Loader2,
  Mail,
  PauseCircle,
  RotateCcw,
  Save,
} from "lucide-react";
import { useAdminSession } from "../context/adminSession";
import {
  getEmailSettings,
  updateEmailSettings,
} from "../utils/emailSettings";

const STATUS_GROUPS = [
  {
    title: "Fulfilment",
    description: "From order confirmation through to delivery.",
    statuses: ["placed", "processing", "shipped", "delivered"],
  },
  {
    title: "Returns & refunds",
    description: "Updates after a customer asks to return an order.",
    statuses: [
      "return_requested",
      "return_in_transit",
      "return_received",
      "returned",
      "cancelled",
      "refunded",
    ],
  },
  {
    title: "Replacements",
    description: "Exchange requests and replacement dispatch updates.",
    statuses: [
      "replacement_requested",
      "replacement_out",
      "replacement_completed",
    ],
  },
];

const STATUS_META = {
  placed: {
    label: "Order placed",
    description: "Confirmation sent when checkout completes.",
  },
  processing: {
    label: "Processing",
    description: "The order is being prepared.",
  },
  shipped: {
    label: "Shipped",
    description: "The parcel has been handed to the courier.",
  },
  delivered: {
    label: "Delivered",
    description: "The parcel reached the customer.",
  },
  return_requested: {
    label: "Return requested",
    description: "The customer asked to return an order.",
  },
  return_in_transit: {
    label: "Return in transit",
    description: "The return parcel is on its way back.",
  },
  return_received: {
    label: "Return received",
    description: "The return parcel reached the store.",
  },
  returned: {
    label: "Return completed",
    description: "The return finished without a refund.",
  },
  cancelled: {
    label: "Cancelled",
    description: "The order was cancelled.",
  },
  refunded: {
    label: "Refunded",
    description: "The refund has been completed.",
  },
  replacement_requested: {
    label: "Replacement requested",
    description: "The customer asked for an exchange.",
  },
  replacement_out: {
    label: "Replacement dispatched",
    description: "The replacement order has been shipped.",
  },
  replacement_completed: {
    label: "Replacement completed",
    description: "The exchange has been completed.",
  },
};

const ORDER_STATUSES = STATUS_GROUPS.flatMap((group) => group.statuses);

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const allFlags = (value) =>
  Object.fromEntries(ORDER_STATUSES.map((status) => [status, value]));

const normalizeStatuses = (statuses) =>
  Object.fromEntries(
    ORDER_STATUSES.map((status) => [status, statuses?.[status] === true]),
  );

const Email = () => {
  const { token } = useAdminSession();

  const [statuses, setStatuses] = useState(() => allFlags(false));
  const [disabledForAll, setDisabledForAll] = useState(false);
  const [saved, setSaved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const allCheckboxRef = useRef(null);

  const applySettings = useCallback((data) => {
    const nextStatuses = normalizeStatuses(data?.statuses);
    const nextDisabled = data?.disabledForAll === true;

    setStatuses(nextStatuses);
    setDisabledForAll(nextDisabled);
    setSaved({
      statuses: nextStatuses,
      disabledForAll: nextDisabled,
      updatedAt: data?.updatedAt || null,
      updatedBy: data?.updatedBy || "",
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getEmailSettings(token);
      applySettings(result.data);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, applySettings]);

  useEffect(() => {
    // Loading settings is the effect's external sync; the skeleton makes the
    // request visible while it runs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const enabledCount = useMemo(
    () => ORDER_STATUSES.filter((status) => statuses[status]).length,
    [statuses],
  );
  const allEnabled = enabledCount === ORDER_STATUSES.length;
  const someEnabled = enabledCount > 0;

  // Show a partial state on the bulk checkbox when only some statuses are on.
  useEffect(() => {
    if (allCheckboxRef.current) {
      allCheckboxRef.current.indeterminate = someEnabled && !allEnabled;
    }
  }, [someEnabled, allEnabled]);

  const dirty =
    Boolean(saved) &&
    (disabledForAll !== saved.disabledForAll ||
      ORDER_STATUSES.some(
        (status) => Boolean(statuses[status]) !== Boolean(saved.statuses[status]),
      ));

  const toggleAllStatuses = (checked) => {
    setStatuses(allFlags(checked));
  };

  const toggleStatus = (status) => {
    setStatuses((current) => ({ ...current, [status]: !current[status] }));
  };

  const discardChanges = () => {
    if (!saved) return;
    setStatuses({ ...saved.statuses });
    setDisabledForAll(saved.disabledForAll);
  };

  const saveSettings = async () => {
    if (!dirty || saving) return;

    setSaving(true);
    try {
      const result = await updateEmailSettings(token, {
        statuses,
        disabledForAll,
      });
      applySettings(result.data);
      toast.success("Email delivery settings saved");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Email delivery
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Choose which order-status emails are sent to customers.
          </p>
        </div>
        <button
          type="button"
          onClick={saveSettings}
          disabled={!dirty || saving}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {error && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
          <span>{error}</span>
          <button
            type="button"
            onClick={load}
            className="font-semibold text-red-700 underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-6 space-y-3">
          <div className="h-24 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
          <div className="h-56 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
        </div>
      ) : error && !saved ? null : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
              <CheckCircle2 size={15} />
              {enabledCount} of {ORDER_STATUSES.length} status emails enabled
            </span>
            {disabledForAll && (
              <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 font-medium text-red-700">
                <PauseCircle size={15} />
                All delivery paused
              </span>
            )}
            {saved?.updatedAt && (
              <span className="text-xs text-gray-500">
                Last saved {formatDateTime(saved.updatedAt)}
                {saved.updatedBy ? ` by ${saved.updatedBy}` : ""}
              </span>
            )}
          </div>

          <div className="mt-4 rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
                  <Mail size={18} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Order status emails
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Turn individual emails on or off. Changes apply after you
                    save.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 rounded-lg bg-gray-50 p-4 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    ref={allCheckboxRef}
                    type="checkbox"
                    checked={allEnabled}
                    onChange={(event) =>
                      toggleAllStatuses(event.target.checked)
                    }
                    className="mt-0.5 size-4 shrink-0 accent-blue-600"
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-900">
                      All order statuses
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-500">
                      Enable every status listed below.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={disabledForAll}
                    onChange={(event) =>
                      setDisabledForAll(event.target.checked)
                    }
                    className="mt-0.5 size-4 shrink-0 accent-red-600"
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-900">
                      Disable for all
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-500">
                      Pause every status email without clearing the selections
                      below.
                    </span>
                  </span>
                </label>
              </div>

              {disabledForAll && (
                <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
                  Delivery is paused for every status. The selections below
                  will take effect when you turn this off and save.
                </p>
              )}
            </div>

            <div className="space-y-6 px-5 py-5">
              {STATUS_GROUPS.map((group) => {
                const groupEnabled = group.statuses.filter(
                  (status) => statuses[status],
                ).length;

                return (
                  <section key={group.title}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          {group.title}
                        </h3>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {group.description}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {groupEnabled} of {group.statuses.length} enabled
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {group.statuses.map((status) => {
                        const meta = STATUS_META[status];
                        const enabled = Boolean(statuses[status]);

                        return (
                          <label
                            key={status}
                            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                              enabled
                                ? "border-blue-200 bg-blue-50/50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={() => toggleStatus(status)}
                              className="mt-0.5 size-4 shrink-0 accent-blue-600"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-gray-900">
                                {meta.label}
                              </span>
                              <span className="mt-0.5 block text-xs text-gray-500">
                                {meta.description}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-4">
              <p className="text-xs text-gray-500">
                A missing status setting stays off. Email delivery also
                requires the server's mail provider to be configured.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={discardChanges}
                  disabled={!dirty || saving}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw size={15} />
                  Discard
                </button>
                <button
                  type="button"
                  onClick={saveSettings}
                  disabled={!dirty || saving}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={15} />
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Email;
