import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  CubeIcon,
  StarIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { getDashboardAnalytics } from "../utils/analytics";
import { DashboardSkeleton } from "./Loader";

// Brand palette reused across every chart.
const COLORS = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0891b2"];

const STATUS_COLORS = {
  placed: "#6b7280",
  processing: "#d97706",
  shipped: "#2563eb",
  delivered: "#059669",
  return_in_transit: "#0284c7",
  cancelled: "#dc2626",
  refunded: "#0d9488",
  replacement_requested: "#7c3aed",
  replacement_out: "#7c3aed",
  replacement_completed: "#7c3aed",
};

// Amounts are in Indian Rupees to match the storefront (cart/checkout use ₹).
const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const compact = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  })}`;

// "2024-05-03" -> "May 3"
const shortDate = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

// ---------------------------------------------------------------------------

const StatCard = ({ label, value, sub, icon: Icon, tone = "blue" }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    gray: "bg-gray-100 text-gray-600",
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

const ChartCard = ({ title, subtitle, children, className = "" }) => (
  <div className={`rounded-lg border border-gray-200 bg-white p-5 ${className}`}>
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
    </div>
    {children}
  </div>
);

// ---------------------------------------------------------------------------

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(14);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getDashboardAnalytics(days);
      setData(result);
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
  }, [days]);

  return (
    <div className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Sales, inventory and customer insights — live from your store data.
          </p>
        </div>

        {/* Daily-sales window selector */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <label htmlFor="days">Trend window</label>
          <select
            id="days"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
          >
            {[7, 14, 30, 90].map((d) => (
              <option key={d} value={d}>
                Last {d} days
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className="mt-10 rounded-lg border border-dashed border-red-300 bg-red-50 py-16 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={load}
            className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : (
        <DashboardContent data={data} />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------

const DashboardContent = ({ data }) => {
  const {
    summary,
    dailySales,
    statusBreakdown,
    categorySales,
    ratingDistribution,
    bestSellersToday,
    bestSellersMonthly,
    bestSellersAllTime,
    topRatedProducts,
  } = data;

  const statusData = statusBreakdown.filter((s) => s.count > 0);

  return (
    <div className="space-y-6">
      {/* ---- KPI cards ---- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total sales"
          value={money(summary.totalRevenue)}
          sub={`${summary.totalOrders} orders · AOV ${money(summary.avgOrderValue)}`}
          icon={BanknotesIcon}
          tone="green"
        />
        <StatCard
          label="Today's sales"
          value={money(summary.todayRevenue)}
          sub={`${summary.todayOrders} order(s) today · MTD ${money(summary.monthRevenue)}`}
          icon={ArrowTrendingUpIcon}
          tone="blue"
        />
        <StatCard
          label="Inventory value"
          value={money(summary.inventoryRetailValue)}
          sub={`${summary.unitsInStock} units in stock · ${summary.totalProducts} products`}
          icon={CubeIcon}
          tone="violet"
        />
        <StatCard
          label="Customer rating"
          value={`${summary.avgRating} / 5`}
          sub={`${summary.totalReviews} reviews`}
          icon={StarIcon}
          tone="amber"
        />
      </div>

      {/* ---- Daily sales trend + status breakdown ---- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard
          title="Daily sales"
          subtitle="Revenue and units sold per day"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailySales} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tickFormatter={shortDate}
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={compact}
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value, name) =>
                  name === "revenue" ? money(value) : value
                }
                labelFormatter={(label) => shortDate(label)}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                strokeWidth={2}
                fill="url(#revGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Order status" subtitle="Orders by fulfilment stage">
          {statusData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {statusData.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status] || "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  formatter={(value) =>
                    value.charAt(0).toUpperCase() + value.slice(1)
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ---- Best sellers (today + monthly) ---- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BestSellersCard
          title="Best sellers today"
          subtitle="Top products by units sold today"
          items={bestSellersToday}
        />
        <BestSellersCard
          title="Best sellers this month"
          subtitle="Top products by units sold this month"
          items={bestSellersMonthly}
        />
      </div>

      {/* ---- Revenue by category + ratings ---- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Revenue by category" subtitle="Total sales value per category">
          {categorySales.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categorySales} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={compact}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip formatter={(value) => money(value)} />
                <Bar dataKey="value" name="Revenue" radius={[6, 6, 0, 0]}>
                  {categorySales.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Customer ratings"
          subtitle={`Average ${summary.avgRating} / 5 from ${summary.totalReviews} reviews`}
        >
          {summary.totalReviews === 0 ? (
            <EmptyChart label="No reviews yet." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={ratingDistribution}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis
                  type="category"
                  dataKey="star"
                  tickFormatter={(s) => `${s}★`}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip formatter={(value) => `${value} review(s)`} />
                <Bar dataKey="count" name="Reviews" fill="#d97706" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ---- Inventory health + top rated ---- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Inventory health" subtitle="Stock alerts at a glance">
          <div className="space-y-4">
            <InventoryRow
              label="Units in stock"
              value={summary.unitsInStock}
              tone="text-gray-900"
            />
            <InventoryRow
              label="Inventory value (retail)"
              value={money(summary.inventoryRetailValue)}
              tone="text-gray-900"
            />
            <InventoryRow
              label="Low stock (≤ 5 units)"
              value={summary.lowStock}
              tone={summary.lowStock > 0 ? "text-amber-600" : "text-gray-900"}
            />
            <InventoryRow
              label="Out of stock"
              value={summary.outOfStock}
              tone={summary.outOfStock > 0 ? "text-red-600" : "text-gray-900"}
            />
            {(summary.lowStock > 0 || summary.outOfStock > 0) && (
              <p className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <ExclamationTriangleIcon className="size-4 shrink-0" />
                {summary.outOfStock} out of stock and {summary.lowStock} low —
                restock soon.
              </p>
            )}

            <div className="border-t border-gray-100 pt-4">
              <InventoryRow
                label="Returns in transit"
                value={summary.returnsInTransit}
                tone={summary.returnsInTransit > 0 ? "text-sky-600" : "text-gray-900"}
              />
              <InventoryRow
                label="Cancelled orders"
                value={summary.cancelledOrders}
                tone={summary.cancelledOrders > 0 ? "text-red-600" : "text-gray-900"}
              />
              <InventoryRow
                label="Refunded orders"
                value={summary.refundedOrders}
                tone={summary.refundedOrders > 0 ? "text-teal-600" : "text-gray-900"}
              />
              <InventoryRow
                label="Value refunded"
                value={money(summary.refundedValue)}
                tone="text-gray-900"
              />
              <InventoryRow
                label="Replacements in progress"
                value={summary.replacementsInProgress}
                tone={summary.replacementsInProgress > 0 ? "text-violet-600" : "text-gray-900"}
              />
              <InventoryRow
                label="Replacements completed"
                value={summary.replacementsCompleted}
                tone="text-gray-900"
              />
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="Top rated products"
          subtitle="Highest rated by customers"
          className="lg:col-span-2"
        >
          {topRatedProducts.length === 0 ? (
            <EmptyChart label="No product ratings yet." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={topRatedProducts}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip formatter={(value) => `${value} / 5`} />
                <Bar dataKey="rating" name="Avg rating" fill="#7c3aed" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ---- Orders volume + all-time best sellers ---- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Orders per day" subtitle="Order volume over the selected window">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dailySales} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tickFormatter={shortDate}
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip labelFormatter={(label) => shortDate(label)} />
              <Line
                type="monotone"
                dataKey="orders"
                name="Orders"
                stroke="#059669"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <BestSellersCard
          title="Best sellers all time"
          subtitle="Top products by units sold overall"
          items={bestSellersAllTime}
        />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------

const InventoryRow = ({ label, value, tone }) => (
  <div className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
    <span className="text-sm text-gray-600">{label}</span>
    <span className={`text-sm font-semibold ${tone}`}>{value}</span>
  </div>
);

const EmptyChart = ({ label = "No data yet." }) => (
  <div className="flex h-75 items-center justify-center rounded-md border border-dashed border-gray-200">
    <p className="text-sm text-gray-400">{label}</p>
  </div>
);

const BestSellersCard = ({ title, subtitle, items }) => (
  <ChartCard title={title} subtitle={subtitle}>
    {!items || items.length === 0 ? (
      <EmptyChart label="No sales in this period." />
    ) : (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={items}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
          <YAxis
            type="category"
            dataKey="title"
            width={150}
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip formatter={(value) => `${value} sold`} />
          <Bar dataKey="units" name="Units sold" fill="#2563eb" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )}
  </ChartCard>
);

export default Dashboard;
