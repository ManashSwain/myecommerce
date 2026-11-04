import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Bot,
  CheckCircle2,
  Loader2,
  Power,
  RotateCcw,
  Save,
  ShieldCheck,
} from "lucide-react";
import { useAdminSession } from "../context/adminSession";
import { getAiSettings, updateAiSettings } from "../utils/aiSettings";

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

const AiAssistant = () => {
  const { token } = useAdminSession();

  const [enabled, setEnabled] = useState(false);
  const [saved, setSaved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const applySettings = useCallback((data) => {
    const nextEnabled = data?.enabled !== false;

    setEnabled(nextEnabled);
    setSaved({
      enabled: nextEnabled,
      updatedAt: data?.updatedAt || null,
      updatedBy: data?.updatedBy || "",
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getAiSettings(token);
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

  const dirty = Boolean(saved) && enabled !== saved.enabled;

  const discardChanges = () => {
    if (!saved) return;
    setEnabled(saved.enabled);
  };

  const saveSettings = async () => {
    if (!dirty || saving) return;

    setSaving(true);
    try {
      const result = await updateAiSettings(token, { enabled });
      applySettings(result.data);
      toast.success(
        enabled
          ? "AI assistant enabled for all members"
          : "AI assistant turned off for all members",
      );
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
            AI assistant
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Turn the storefront shopping assistant on or off for all members.
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
          <div className="h-12 w-64 animate-pulse rounded-full bg-gray-100" />
          <div className="h-52 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
        </div>
      ) : error && !saved ? null : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium ${
                enabled
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {enabled ? <CheckCircle2 size={15} /> : <Power size={15} />}
              {enabled
                ? "Enabled for all members"
                : "Disabled for all members"}
            </span>
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
                <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                  <Bot size={18} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Storefront assistant
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    The Gemini-backed helper that answers product, delivery and
                    returns questions.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 py-5">
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-gray-200 p-4 transition hover:border-gray-300">
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-900">
                    AI assistant availability
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    Allow every signed-in customer to open and use the
                    assistant. Changes apply after you save.
                  </span>
                </span>
                <span className="relative inline-flex shrink-0 items-center">
                  <input
                    type="checkbox"
                    role="switch"
                    checked={enabled}
                    onChange={(event) => setEnabled(event.target.checked)}
                    disabled={saving}
                    aria-label="Enable AI assistant for all members"
                    className="peer sr-only"
                  />
                  <span className="block h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-emerald-500 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-600" />
                  <span className="pointer-events-none absolute top-1 left-1 size-4 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                </span>
              </label>

              {enabled ? (
                <p className="mt-3 flex items-start gap-2 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  <ShieldCheck size={15} className="mt-0.5 shrink-0" />
                  Signed-in customers can use the assistant. Signed-out
                  visitors are still asked to sign in before chatting.
                </p>
              ) : (
                <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
                  The assistant is turned off. The chat launcher is hidden from
                  every customer, and new chat requests are rejected until you
                  turn it back on and save.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-4">
              <p className="text-xs text-gray-500">
                This switch applies to every signed-in member. The server
                enforces it independently of the storefront UI.
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

export default AiAssistant;
