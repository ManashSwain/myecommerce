import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock3,
  Inbox,
  Loader2,
  Plus,
  Search,
  Ticket as TicketIcon,
} from "lucide-react";
import { useAdminSession } from "../context/adminSession";
import { createTicket, getTickets, updateTicket } from "../utils/tickets";
import FormModal from "./FormModal";

const STATUS_META = {
  open: {
    label: "Open",
    className: "bg-blue-50 text-blue-700 ring-blue-600/20",
  },
  in_progress: {
    label: "In progress",
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  resolved: {
    label: "Resolved",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  closed: {
    label: "Closed",
    className: "bg-gray-100 text-gray-600 ring-gray-500/20",
  },
};

const PRIORITY_META = {
  low: {
    label: "Low",
    className: "bg-gray-100 text-gray-600 ring-gray-500/20",
  },
  normal: {
    label: "Normal",
    className: "bg-blue-50 text-blue-700 ring-blue-600/20",
  },
  high: {
    label: "High",
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  urgent: {
    label: "Urgent",
    className: "bg-red-50 text-red-700 ring-red-600/20",
  },
};

const CATEGORY_LABELS = {
  order: "Order",
  product: "Product",
  payment: "Payment",
  delivery: "Delivery",
  account: "Account",
  other: "Other",
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS);
const STATUS_OPTIONS = Object.entries(STATUS_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));
const PRIORITY_OPTIONS = Object.entries(PRIORITY_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

const inputClass =
  "block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelClass = "block text-sm font-medium text-gray-700";

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

const Badge = ({ meta }) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
      meta?.className || STATUS_META.closed.className
    }`}
  >
    {meta?.label || "Unknown"}
  </span>
);

const StatCard = ({ label, value, sub, icon: Icon, tone = "blue" }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    green: "bg-emerald-50 text-emerald-600",
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
            <Icon size={20} />
          </span>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, htmlFor, hint, children }) => (
  <div>
    <label htmlFor={htmlFor} className={labelClass}>
      {label}
    </label>
    <div className="mt-1">{children}</div>
    {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
  </div>
);

const EMPTY_FORM = {
  requesterName: "",
  requesterEmail: "",
  subject: "",
  category: "order",
  priority: "normal",
  status: "open",
  orderNumber: "",
  description: "",
};

const EMPTY_SUMMARY = {
  total: 0,
  open: 0,
  inProgress: 0,
  resolved: 0,
  closed: 0,
  urgent: 0,
};

const Tickets = () => {
  const { token } = useAdminSession();

  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [detailTicket, setDetailTicket] = useState(null);
  const [detailStatus, setDetailStatus] = useState("open");
  const [detailPriority, setDetailPriority] = useState("normal");
  const [detailResponse, setDetailResponse] = useState("");
  const [detailError, setDetailError] = useState("");
  const [detailSaving, setDetailSaving] = useState(false);

  const requestRef = useRef(0);

  // Debounce search so typing doesn't hit the API on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setError("");

    try {
      const result = await getTickets(token, {
        search: debouncedSearch,
        page,
        limit: 10,
        status,
        priority,
        category,
      });

      if (requestId !== requestRef.current) return;

      setTickets(result.data || []);
      setSummary(result.summary || EMPTY_SUMMARY);
      setPagination(
        result.pagination || {
          page,
          limit: 10,
          total: result.data?.length || 0,
          totalPages: 1,
        },
      );

      // The server clamps pages after a filter change; follow it.
      if (result.pagination && result.pagination.page !== page) {
        setPage(result.pagination.page);
      }
    } catch (err) {
      if (requestId !== requestRef.current) return;
      setError(err.message);
      toast.error(err.message);
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [token, debouncedSearch, page, status, priority, category]);

  useEffect(() => {
    // Loading tickets is the effect's external sync; the loading state makes
    // the initial fetch visible in the table.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setCreateOpen(true);
  };

  const closeCreate = () => {
    if (!saving) setCreateOpen(false);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submitCreate = async (event) => {
    event.preventDefault();
    setFormError("");
    setSaving(true);

    try {
      const result = await createTicket(token, {
        ...form,
        subject: form.subject.trim(),
        description: form.description.trim(),
        requesterName: form.requesterName.trim(),
        requesterEmail: form.requesterEmail.trim(),
        orderNumber: form.orderNumber.trim(),
      });

      toast.success(`Ticket ${result.data.ticketNumber} created`);
      setCreateOpen(false);
      setForm(EMPTY_FORM);

      if (page === 1) {
        await load();
      } else {
        setPage(1);
      }
    } catch (err) {
      setFormError(err.message);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openTicket = (ticket) => {
    setDetailTicket(ticket);
    setDetailStatus(ticket.status);
    setDetailPriority(ticket.priority);
    setDetailResponse("");
    setDetailError("");
  };

  const closeDetail = () => {
    if (!detailSaving) setDetailTicket(null);
  };

  const detailDirty =
    Boolean(detailTicket) &&
    (detailStatus !== detailTicket.status ||
      detailPriority !== detailTicket.priority ||
      detailResponse.trim().length > 0);

  const saveDetail = async () => {
    if (!detailTicket) return;

    const response = detailResponse.trim();
    if (response && response.length < 2) {
      setDetailError("Write a slightly longer reply.");
      return;
    }

    setDetailSaving(true);
    setDetailError("");

    try {
      const payload = {};
      if (detailStatus !== detailTicket.status) payload.status = detailStatus;
      if (detailPriority !== detailTicket.priority) {
        payload.priority = detailPriority;
      }
      if (response) payload.response = response;

      const result = await updateTicket(token, detailTicket._id, payload);

      const updated = result.data;
      setDetailTicket(updated);
      setDetailResponse("");
      setTickets((current) =>
        current.map((ticket) =>
          ticket._id === updated._id ? updated : ticket,
        ),
      );
      toast.success(response ? "Reply sent to the customer" : "Ticket updated");
      await load();
    } catch (err) {
      setDetailError(err.message);
      toast.error(err.message);
    } finally {
      setDetailSaving(false);
    }
  };

  const changeFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  const pageStart =
    pagination.total === 0
      ? 0
      : (pagination.page - 1) * pagination.limit + 1;
  const pageEnd = Math.min(
    pagination.page * pagination.limit,
    pagination.total,
  );

  return (
    <div className="py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Support tickets
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Issues raised by customers, plus tickets you create on their behalf.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          New ticket
        </button>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total tickets"
          value={summary.total}
          sub="All time"
          icon={TicketIcon}
          tone="blue"
        />
        <StatCard
          label="Open"
          value={summary.open}
          sub={`${summary.urgent} urgent`}
          icon={CircleDot}
          tone="amber"
        />
        <StatCard
          label="In progress"
          value={summary.inProgress}
          sub="Being worked on"
          icon={Clock3}
          tone="violet"
        />
        <StatCard
          label="Resolved"
          value={summary.resolved}
          sub={`${summary.closed} closed`}
          icon={CheckCircle2}
          tone="green"
        />
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Search + filters */}
      <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-sm">
          <Search
            aria-hidden="true"
            size={18}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search ticket, requester or order"
            aria-label="Search tickets"
            className="block w-full rounded-md border border-gray-300 bg-white py-2 pr-3 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-500">
            Status
            <select
              value={status}
              onChange={changeFilter(setStatus)}
              className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs font-medium text-gray-500">
            Priority
            <select
              value={priority}
              onChange={changeFilter(setPriority)}
              className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All</option>
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs font-medium text-gray-500">
            Category
            <select
              value={category}
              onChange={changeFilter(setCategory)}
              className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All</option>
              {CATEGORY_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Ticket table */}
      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
            <Loader2 size={18} className="animate-spin" />
            Loading tickets…
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <span className="rounded-full bg-gray-100 p-3 text-gray-400">
              <Inbox size={24} />
            </span>
            <p className="mt-3 text-sm font-medium text-gray-900">
              No tickets found
            </p>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              {debouncedSearch || status !== "all" || priority !== "all" || category !== "all"
                ? "Try changing the search or filters."
                : "Customer tickets will appear here as soon as they're raised."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium tracking-wide text-gray-500 uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Ticket
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Requester
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Category
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Priority
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Created
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openTicket(ticket)}
                        className="block max-w-xs text-left"
                      >
                        <span className="font-mono text-xs font-medium text-blue-600">
                          {ticket.ticketNumber}
                        </span>
                        <span className="mt-0.5 block truncate font-medium text-gray-900">
                          {ticket.subject}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {ticket.requester.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {ticket.requester.email}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {CATEGORY_LABELS[ticket.category] || "Other"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge meta={PRIORITY_META[ticket.priority]} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge meta={STATUS_META[ticket.status]} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openTicket(ticket)}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && tickets.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            Showing {pageStart}–{pageEnd} of {pagination.total}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={pagination.page <= 1}
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((current) =>
                  Math.min(current + 1, pagination.totalPages),
                )
              }
              disabled={pagination.page >= pagination.totalPages}
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Create ticket */}
      <FormModal
        open={createOpen}
        title="Create support ticket"
        onClose={closeCreate}
      >
        <form onSubmit={submitCreate} className="space-y-4">
          {formError && (
            <p
              role="alert"
              className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600"
            >
              {formError}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Customer name" htmlFor="ticket-requester-name">
              <input
                id="ticket-requester-name"
                name="requesterName"
                type="text"
                required
                maxLength={120}
                value={form.requesterName}
                onChange={handleFormChange}
                placeholder="Jane Doe"
                className={inputClass}
              />
            </Field>

            <Field label="Customer email" htmlFor="ticket-requester-email">
              <input
                id="ticket-requester-email"
                name="requesterEmail"
                type="email"
                required
                maxLength={200}
                value={form.requesterEmail}
                onChange={handleFormChange}
                placeholder="jane@example.com"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Subject" htmlFor="ticket-subject">
            <input
              id="ticket-subject"
              name="subject"
              type="text"
              required
              minLength={5}
              maxLength={160}
              value={form.subject}
              onChange={handleFormChange}
              placeholder="Briefly describe the issue"
              className={inputClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Category" htmlFor="ticket-category">
              <select
                id="ticket-category"
                name="category"
                value={form.category}
                onChange={handleFormChange}
                className={inputClass}
              >
                {CATEGORY_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Priority" htmlFor="ticket-priority">
              <select
                id="ticket-priority"
                name="priority"
                value={form.priority}
                onChange={handleFormChange}
                className={inputClass}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Status" htmlFor="ticket-status">
              <select
                id="ticket-status"
                name="status"
                value={form.status}
                onChange={handleFormChange}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field
            label="Related order number (optional)"
            htmlFor="ticket-order-number"
          >
            <input
              id="ticket-order-number"
              name="orderNumber"
              type="text"
              maxLength={64}
              value={form.orderNumber}
              onChange={handleFormChange}
              placeholder="e.g. ORD-12345"
              className={inputClass}
            />
          </Field>

          <Field label="Description" htmlFor="ticket-description">
            <textarea
              id="ticket-description"
              name="description"
              required
              minLength={10}
              maxLength={5000}
              rows={5}
              value={form.description}
              onChange={handleFormChange}
              placeholder="What happened, and what would you like us to do?"
              className={inputClass}
            />
          </Field>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={closeCreate}
              disabled={saving}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create ticket"}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Ticket detail */}
      <FormModal
        open={Boolean(detailTicket)}
        title={detailTicket ? `Ticket ${detailTicket.ticketNumber}` : "Ticket"}
        onClose={closeDetail}
      >
        {detailTicket && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">
                  {detailTicket.subject}
                </h4>
                <p className="mt-1 text-xs text-gray-500">
                  Created {formatDateTime(detailTicket.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge meta={STATUS_META[detailTicket.status]} />
                <Badge meta={PRIORITY_META[detailTicket.priority]} />
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 p-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                  Requester
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {detailTicket.requester.name}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                  Email
                </dt>
                <dd className="mt-1 text-sm">
                  <a
                    href={`mailto:${detailTicket.requester.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {detailTicket.requester.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                  Category
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {CATEGORY_LABELS[detailTicket.category] || "Other"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                  Related order
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {detailTicket.orderNumber || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                  Source
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {detailTicket.source === "admin"
                    ? "Created by admin"
                    : "Customer contact form"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                  Last status change
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDateTime(detailTicket.statusUpdatedAt)}
                  {detailTicket.statusUpdatedBy
                    ? ` · ${detailTicket.statusUpdatedBy}`
                    : ""}
                </dd>
              </div>
              {detailTicket.createdBy && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                    Created by
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {detailTicket.createdBy.name || "Admin"}
                    {detailTicket.createdBy.email
                      ? ` (${detailTicket.createdBy.email})`
                      : ""}
                  </dd>
                </div>
              )}
            </dl>

            <div>
              <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                Description
              </p>
              <div className="mt-2 rounded-lg bg-gray-50 p-4 text-sm leading-6 whitespace-pre-wrap text-gray-700">
                {detailTicket.description}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">
                  Conversation
                </p>
                <span className="text-xs text-gray-500">
                  {(detailTicket.adminReplies || []).length} public{" "}
                  {(detailTicket.adminReplies || []).length === 1
                    ? "reply"
                    : "replies"}
                </span>
              </div>

              {detailTicket.adminReplies?.length ? (
                <ul className="mt-3 space-y-3">
                  {detailTicket.adminReplies.map((reply, index) => (
                    <li
                      key={`${reply.createdAt}-${index}`}
                      className="rounded-lg bg-blue-50 px-3 py-2.5 ring-1 ring-inset ring-blue-100"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-blue-800">
                          {reply.authorName || "Support team"}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {formatDateTime(reply.createdAt)}
                        </p>
                      </div>
                      <p className="mt-1 text-sm leading-6 whitespace-pre-line text-gray-700">
                        {reply.message}
                      </p>
                      {reply.authorEmail && (
                        <p className="mt-1 text-[11px] text-gray-400">
                          {reply.authorEmail}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-gray-500">
                  No public replies yet. Anything you write below will be
                  visible to the customer in their account.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900">
                Update ticket &amp; reply
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="detail-status"
                    className="text-xs font-medium text-gray-600"
                  >
                    Status
                  </label>
                  <select
                    id="detail-status"
                    value={detailStatus}
                    onChange={(event) => setDetailStatus(event.target.value)}
                    className={`mt-1 ${inputClass}`}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="detail-priority"
                    className="text-xs font-medium text-gray-600"
                  >
                    Priority
                  </label>
                  <select
                    id="detail-priority"
                    value={detailPriority}
                    onChange={(event) => setDetailPriority(event.target.value)}
                    className={`mt-1 ${inputClass}`}
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3">
                <label
                  htmlFor="detail-response"
                  className="text-xs font-medium text-gray-600"
                >
                  Reply to customer{" "}
                  <span className="font-normal text-gray-500">
                    (visible in their account)
                  </span>
                </label>
                <textarea
                  id="detail-response"
                  rows={4}
                  maxLength={3000}
                  value={detailResponse}
                  onChange={(event) => setDetailResponse(event.target.value)}
                  placeholder="Let the customer know what happens next…"
                  className={`mt-1 ${inputClass}`}
                />
                <p className="mt-1 text-xs text-gray-500">
                  This message appears with the ticket under the customer's
                  "Your tickets" list.
                </p>
              </div>

              {detailError && (
                <p
                  role="alert"
                  className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600"
                >
                  {detailError}
                </p>
              )}

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDetail}
                  disabled={detailSaving}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={saveDetail}
                  disabled={!detailDirty || detailSaving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {detailSaving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </FormModal>
    </div>
  );
};

export default Tickets;
