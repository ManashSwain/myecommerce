// Shared loading placeholders.
// `PageLoader` is a simple centered spinner; the *Skeleton components mirror
// the shape of the real content so pages don't flash empty before data loads.

// A single grey shimmer block. Everything else is composed from this.
export const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />
);

// Centered spinner for generic use.
const PageLoader = ({ label = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center py-24">
    <div className="size-8 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
    {label && <p className="mt-4 text-sm text-gray-500">{label}</p>}
  </div>
);

export default PageLoader;

// Skeleton for the wishlist product grid (2/3/4 columns).
export const ProductGridSkeleton = ({ count = 8 }) => (
  <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="group relative">
        <Skeleton className="aspect-square w-full" />
        <Skeleton className="mt-4 h-4 w-3/4" />
        <Skeleton className="mt-2 h-3 w-1/3" />
        <Skeleton className="mt-2 h-4 w-1/4" />
        <div className="mt-3 flex gap-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-7 w-20" />
        </div>
      </div>
    ))}
  </div>
);

// Skeleton for the category product grid (1 / 2 / 3 columns, tall images).
// Mirrors the layout in components/Categoryfilters.jsx.
export const CategoryGridSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="group relative">
        <Skeleton className="aspect-square w-full lg:aspect-auto lg:h-80" />
        <div className="mt-4 flex justify-between">
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/3" />
            <Skeleton className="mt-2 h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    ))}
  </div>
);

// Skeleton for the saved-addresses card grid (1/2/3 columns).
export const CardGridSkeleton = ({ count = 6 }) => (
  <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="mt-3 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-5/6" />
        <Skeleton className="mt-2 h-3 w-2/3" />
        <Skeleton className="mt-2 h-3 w-1/2" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-20" />
        </div>
      </div>
    ))}
  </div>
);

// Skeleton for the orders list (accordion rows).
export const OrdersSkeleton = ({ count = 4 }) => (
  <div className="mt-8 space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-5 py-4"
      >
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-3 w-56" />
          </div>
        </div>
        <Skeleton className="hidden h-4 w-20 sm:block" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="size-5 shrink-0" />
      </div>
    ))}
  </div>
);
