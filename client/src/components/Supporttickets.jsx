import { useEffect, useState } from "react";
import {
  ArrowPathIcon,
  LifebuoyIcon,
  PaperAirplaneIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";
import {
  SignInButton,
  SignUpButton,
  useAuth as useClerkAuth,
} from "@clerk/react";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../constants";
import useAuth from "../customhooks/useAuth";

const CATEGORY_LABELS = {
  order: "Order issue",
  product: "Product question",
  payment: "Payment or refund",
  delivery: "Delivery",
  account: "Account",
  other: "Something else",
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS);

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

const EMPTY_FORM = {
  category: "order",
  subject: "",
  orderNumber: "",
  description: "",
};

const inputClass =
  "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

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

const Supporttickets = () => {
  const { isSignedIn, isLoaded, user } = useAuth();
  const { getToken } = useClerkAuth();

  const [myTickets, setMyTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load the signed-in customer's ticket history. A reload key lets the
  // refresh button re-run this effect without duplicating fetch code.
  useEffect(() => {
    let cancelled = false;

    if (!isLoaded || !isSignedIn) {
      setMyTickets([]);
      setTicketsError("");
      setTicketsLoading(false);
      return undefined;
    }

    (async () => {
      setTicketsLoading(true);
      setTicketsError("");

      try {
        const token = await getToken();
        if (!token) throw new Error("Please sign in again to view your tickets.");

        const response = await fetch(`${API_BASE_URL}/api/tickets/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.success) {
          throw new Error(
            payload?.message || "Could not load your support tickets.",
          );
        }

        if (!cancelled) setMyTickets(payload.data || []);
      } catch (error) {
        if (!cancelled) setTicketsError(error.message);
      } finally {
        if (!cancelled) setTicketsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, user?.id, reloadKey, getToken]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submitTicket = async (event) => {
    event.preventDefault();
    setFormError("");

    const subject = form.subject.trim();
    const description = form.description.trim();
    const orderNumber = form.orderNumber.trim();

    if (subject.length < 5) {
      setFormError("Please add a subject of at least 5 characters.");
      return;
    }

    if (description.length < 10) {
      setFormError("Please describe the issue in at least 10 characters.");
      return;
    }

    if (!isSignedIn) {
      setFormError("Please sign in to raise a support ticket.");
      return;
    }

    setSubmitting(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again to raise a ticket.");

      const name =
        user?.fullName ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
      const email =
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses?.[0]?.emailAddress ||
        "";

      const response = await fetch(`${API_BASE_URL}/api/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject,
          description,
          category: form.category,
          orderNumber,
          name,
          email,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Could not submit your ticket.");
      }

      setMyTickets((current) => [payload.data, ...current]);
      setForm(EMPTY_FORM);
      toast.success(
        `Ticket ${payload.data.ticketNumber} submitted. Updates will appear in Your tickets.`,
      );
    } catch (error) {
      setFormError(error.message);
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openTickets = myTickets.filter(
    (ticket) => ticket.status === "open" || ticket.status === "in_progress",
  ).length;

  return (
    <section
      id="support-ticket"
      aria-labelledby="support-ticket-heading"
      className="scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <LifebuoyIcon aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h3
            id="support-ticket-heading"
            className="text-lg font-semibold text-gray-900"
          >
            Raise a support ticket
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Can't find an answer about an order, payment, delivery or product?
            Send us the details and our team will follow up in your ticket
            history.
          </p>
        </div>
      </div>

      {!isLoaded ? (
        <p className="mt-6 text-sm text-gray-500">Checking your account…</p>
      ) : !isSignedIn ? (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Sign in to raise a ticket
            </p>
            <p className="mt-1 text-sm text-gray-500">
              We use your account so your ticket and our replies stay in one
              place.
            </p>
          </div>
          <div className="mt-4 flex shrink-0 items-center gap-2 sm:mt-0">
            <SignInButton mode="modal">
              <button
                type="button"
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700"
              >
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                type="button"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                Create account
              </button>
            </SignUpButton>
          </div>
        </div>
      ) : (
        <>
          <form onSubmit={submitTicket} className="mt-6 space-y-4">
            {formError && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {formError}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="ticket-category"
                  className="block text-sm font-medium text-gray-700"
                >
                  What is this about?
                </label>
                <select
                  id="ticket-category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className={`mt-1.5 ${inputClass}`}
                >
                  {CATEGORY_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="ticket-order-number"
                  className="block text-sm font-medium text-gray-700"
                >
                  Order number{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  id="ticket-order-number"
                  name="orderNumber"
                  type="text"
                  maxLength={64}
                  value={form.orderNumber}
                  onChange={handleChange}
                  placeholder="e.g. ORD-12345"
                  className={`mt-1.5 ${inputClass}`}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="ticket-subject"
                className="block text-sm font-medium text-gray-700"
              >
                Subject
              </label>
              <input
                id="ticket-subject"
                name="subject"
                type="text"
                required
                minLength={5}
                maxLength={160}
                value={form.subject}
                onChange={handleChange}
                placeholder="A short summary of the issue"
                className={`mt-1.5 ${inputClass}`}
              />
            </div>

            <div>
              <label
                htmlFor="ticket-description"
                className="block text-sm font-medium text-gray-700"
              >
                What happened?
              </label>
              <textarea
                id="ticket-description"
                name="description"
                required
                minLength={10}
                maxLength={5000}
                rows={5}
                value={form.description}
                onChange={handleChange}
                placeholder="Include any details that will help us resolve this faster."
                className={`mt-1.5 ${inputClass}`}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                Status updates and replies from our team will appear under
                "Your tickets" below.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PaperAirplaneIcon aria-hidden="true" className="size-4" />
                {submitting ? "Submitting…" : "Submit ticket"}
              </button>
            </div>
          </form>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Your tickets
                </h4>
                <p className="mt-0.5 text-xs text-gray-500">
                  {openTickets > 0
                    ? `${openTickets} still open or in progress`
                    : "Tickets you raise will appear here"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReloadKey((value) => value + 1)}
                disabled={ticketsLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                <ArrowPathIcon
                  aria-hidden="true"
                  className={`size-3.5 ${ticketsLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>

            {ticketsError && (
              <p
                role="alert"
                className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {ticketsError}
              </p>
            )}

            {ticketsLoading && myTickets.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">Loading your tickets…</p>
            ) : myTickets.length === 0 ? (
              <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
                <TicketIcon aria-hidden="true" className="size-7 text-gray-400" />
                <p className="mt-2 text-sm font-medium text-gray-700">
                  No tickets yet
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Use the form above if you need help with anything.
                </p>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {myTickets.map((ticket) => {
                  const status = STATUS_META[ticket.status] || STATUS_META.open;
                  const priority =
                    PRIORITY_META[ticket.priority] || PRIORITY_META.normal;
                  return (
                    <li
                      key={ticket._id}
                      className="rounded-xl border border-gray-200 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-mono text-[11px] font-medium text-gray-500">
                            {ticket.ticketNumber}
                          </p>
                          <p className="mt-0.5 font-medium text-gray-900">
                            {ticket.subject}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${status.className}`}
                          >
                            {status.label}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${priority.className}`}
                          >
                            {priority.label} priority
                          </span>
                        </div>
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 whitespace-pre-line text-gray-600">
                        {ticket.description}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>
                          {CATEGORY_LABELS[ticket.category] || "Support"}
                        </span>
                        <span>Submitted {formatDate(ticket.createdAt)}</span>
                        {ticket.orderNumber && (
                          <span>Order {ticket.orderNumber}</span>
                        )}
                        {ticket.status !== "open" && ticket.statusUpdatedAt && (
                          <span>
                            Updated {formatDate(ticket.statusUpdatedAt)}
                          </span>
                        )}
                      </div>

                      {ticket.adminReplies?.length > 0 && (
                        <div className="mt-3 border-t border-gray-100 pt-3">
                          <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                            Replies from support
                          </p>
                          <ul className="mt-2 space-y-2">
                            {ticket.adminReplies.map((reply, index) => (
                              <li
                                key={`${reply.createdAt}-${index}`}
                                className="rounded-lg bg-indigo-50/70 px-3 py-2.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-xs font-semibold text-indigo-800">
                                    {reply.authorName || "Support team"}
                                  </p>
                                  <p className="text-[11px] text-gray-500">
                                    {formatDateTime(reply.createdAt)}
                                  </p>
                                </div>
                                <p className="mt-1 text-sm leading-6 whitespace-pre-line text-gray-700">
                                  {reply.message}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default Supporttickets;
