import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import {
  UserGroupIcon,
  CheckCircleIcon,
  NoSymbolIcon,
  UserPlusIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { getAllUsers, setUserBlocked } from "../utils/user";
import ConfirmModal from "./ConfirmModal";

// Amounts are in Indian Rupees to match the storefront (cart/checkout use ₹).
const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const initials = (user) => {
  const a = (user.firstName || "").trim();
  const b = (user.lastName || "").trim();
  if (a || b) return `${a[0] || ""}${b[0] || ""}`.toUpperCase();
  return (user.username || user.email || "?").charAt(0).toUpperCase();
};

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "blocked", label: "Blocked" },
];

// A KPI card at the top of the page.
const StatCard = ({ label, value, sub, icon: Icon, tone = "blue" }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    violet: "bg-violet-50 text-violet-600",
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

const Users = () => {
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    newUsers: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  // Block / unblock dialog
  const [blockTarget, setBlockTarget] = useState(null); // user object
  const [actionBusy, setActionBusy] = useState(false);

  // Debounce search so we don't hit the API on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1); // reset to first page on a new search
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Load users whenever the query changes.
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAllUsers({
        search: debouncedSearch,
        page,
        limit,
        status,
      });
      setUsers(result.users);
      setSummary(result.summary);
      setPagination(result.pagination);
      // Keep the page in range if the server clamped it.
      if (result.pagination.page !== page) {
        setPage(result.pagination.page);
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page, limit, status]);

  const confirmToggleBlock = async () => {
    if (!blockTarget) return;
    const willBlock = !blockTarget.isBlocked;
    setActionBusy(true);
    try {
      await setUserBlocked(blockTarget._id, willBlock);
      toast.success(
        willBlock
          ? `${blockTarget.fullName} has been blocked`
          : `${blockTarget.fullName} has been unblocked`,
      );
      setBlockTarget(null);
      await load(); // refresh list + stats
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  // ----- Pagination window (1 … current ± 1 … last) ---------------------
  const pageItems = useMemo(() => {
    const total = pagination.totalPages;
    const current = pagination.page;
    const pages = [];
    for (let p = 1; p <= total; p += 1) {
      if (p === 1 || p === total || Math.abs(p - current) <= 1) {
        pages.push(p);
      }
    }
    return pages;
  }, [pagination.totalPages, pagination.page]);

  const goToPage = (next) => {
    setPage(Math.min(Math.max(1, next), pagination.totalPages));
  };

  const pageStart =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
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
            Users
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {summary.totalUsers} registered customer
            {summary.totalUsers === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total users"
          value={summary.totalUsers}
          sub="All registered accounts"
          icon={UserGroupIcon}
          tone="blue"
        />
        <StatCard
          label="Active"
          value={summary.activeUsers}
          sub="Accounts in good standing"
          icon={CheckCircleIcon}
          tone="green"
        />
        <StatCard
          label="Blocked"
          value={summary.blockedUsers}
          sub="Accounts suspended by admin"
          icon={NoSymbolIcon}
          tone="red"
        />
        <StatCard
          label="New (30 days)"
          value={summary.newUsers}
          sub="Sign-ups in the last month"
          icon={UserPlusIcon}
          tone="violet"
        />
      </div>

      {/* Search + status filter + rows-per-page */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <MagnifyingGlassIcon
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, username or email"
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pr-3 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Status pills */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setStatus(f.key);
                  setPage(1);
                }}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  status === f.key
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-600"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rows per page */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <label htmlFor="page-size">Rows per page</label>
          <select
            id="page-size"
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* List */}
      {loading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: limit > 5 ? 5 : limit }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg border border-gray-200 bg-gray-100"
            />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-gray-300 py-24 text-center">
          <p className="text-sm text-gray-500">
            {debouncedSearch
              ? "No users match your search."
              : status === "blocked"
                ? "No blocked users."
                : "No users yet."}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {users.map((user) => (
            <div
              key={user._id}
              className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              {/* Identity */}
              <div className="flex min-w-0 items-center gap-4">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.fullName}
                    className="size-12 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
                    {initials(user)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-sm font-semibold text-gray-900">
                    {user.fullName}
                    {user.isBlocked ? (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                        Blocked
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Active
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-gray-500">{user.email}</p>
                  {user.username && (
                    <p className="truncate text-xs text-gray-400">
                      @{user.username}
                    </p>
                  )}
                </div>
              </div>

              {/* Activity + joined + action */}
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2 sm:justify-end">
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900">
                    {user.orderCount}
                  </p>
                  <p className="text-xs text-gray-500">
                    order{user.orderCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(user.totalSpent)}
                  </p>
                  <p className="text-xs text-gray-500">spent</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(user.createdAt)}
                  </p>
                  <p className="text-xs text-gray-500">joined</p>
                </div>

                {/* Block / Unblock action */}
                <button
                  type="button"
                  onClick={() => setBlockTarget(user)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
                    user.isBlocked
                      ? "border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      : "border border-red-300 text-red-700 hover:bg-red-50"
                  }`}
                >
                  {user.isBlocked ? (
                    <>
                      <ShieldCheckIcon className="size-4" />
                      Unblock
                    </>
                  ) : (
                    <>
                      <NoSymbolIcon className="size-4" />
                      Block
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.total > 0 && (
        <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-700">{pageStart}</span>
            –<span className="font-medium text-gray-700">{pageEnd}</span> of{" "}
            <span className="font-medium text-gray-700">{pagination.total}</span>{" "}
            user{pagination.total === 1 ? "" : "s"}
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goToPage(1)}
              disabled={pagination.page === 1}
              className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              «
            </button>
            <button
              type="button"
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>

            {pageItems.map((p, index) => (
              <span key={p} className="flex items-center">
                {index > 0 && pageItems[index - 1] !== p - 1 && (
                  <span className="px-1 text-sm text-gray-400">…</span>
                )}
                <button
                  type="button"
                  onClick={() => goToPage(p)}
                  className={`min-w-9 rounded-md border px-2.5 py-1.5 text-sm font-medium ${
                    p === pagination.page
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              </span>
            ))}

            <button
              type="button"
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => goToPage(pagination.totalPages)}
              disabled={pagination.page === pagination.totalPages}
              className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              »
            </button>
          </div>
        </div>
      )}

      {/* Block / Unblock confirmation */}
      <ConfirmModal
        open={!!blockTarget}
        title={blockTarget?.isBlocked ? "Unblock user" : "Block user"}
        message={
          blockTarget?.isBlocked
            ? `Unblock ${blockTarget?.fullName}? They will be able to use their account again.`
            : `Block ${blockTarget?.fullName}? They will no longer be able to use their account until unblocked.`
        }
        confirmLabel={blockTarget?.isBlocked ? "Yes, unblock" : "Yes, block"}
        tone={blockTarget?.isBlocked ? "green" : "red"}
        onConfirm={() => !actionBusy && confirmToggleBlock()}
        onCancel={() => !actionBusy && setBlockTarget(null)}
      />
    </div>
  );
};

export default Users;
