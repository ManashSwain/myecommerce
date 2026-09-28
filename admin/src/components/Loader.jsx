// Shared loading placeholders for the admin panel.
// Each *Skeleton mirrors the shape of the real content so pages don't flash
// empty before data loads.

// A single grey shimmer block. Everything else is composed from this.
export const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />
);

// Centered spinner for generic use.
const PageLoader = ({ label = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center py-24">
    <div className="size-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
    {label && <p className="mt-4 text-sm text-gray-500">{label}</p>}
  </div>
);

export default PageLoader;

// Skeleton for the Products grid (2/3/4 columns, square image + meta + buttons).
// Mirrors components/Products.jsx.
export const ProductGridSkeleton = ({ count = 8 }) => (
  <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="group relative">
        <Skeleton className="aspect-square w-full rounded-lg" />
        <Skeleton className="mt-4 h-4 w-3/4" />
        <Skeleton className="mt-2 h-3 w-1/2" />
        <div className="mt-2 flex gap-1">
          {Array.from({ length: 5 }).map((__, r) => (
            <Skeleton key={r} className="size-4 rounded-full" />
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="mt-3 flex gap-2">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-20" />
        </div>
      </div>
    ))}
  </div>
);

// Skeleton for the analytics dashboard (stat cards + chart panels).
// Mirrors components/Dashboard.jsx.
export const DashboardSkeleton = () => (
  <div className="py-8">
    <Skeleton className="h-7 w-48" />
    <Skeleton className="mt-2 h-4 w-72" />
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-7 w-32" />
          <Skeleton className="mt-2 h-3 w-20" />
        </div>
      ))}
    </div>
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-lg border border-gray-200 bg-white p-5 lg:col-span-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-72 w-full" />
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-72 w-full" />
      </div>
    </div>
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-4 h-64 w-full" />
        </div>
      ))}
    </div>
  </div>
);

// Skeleton for the Categories / Sub Categories grid (2/4 columns, tall image).
// Mirrors components/CategoryManager.jsx.
export const CategoryGridSkeleton = ({ count = 8 }) => (
  <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-4 lg:gap-x-8">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="group relative">
        <Skeleton className="h-56 w-full rounded-md lg:h-72 xl:h-80" />
        <Skeleton className="mt-4 h-4 w-3/4" />
        <Skeleton className="mt-2 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-2/3" />
        <div className="mt-3 flex gap-2">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-20" />
        </div>
      </div>
    ))}
  </div>
);
