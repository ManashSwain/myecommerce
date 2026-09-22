import { useEffect, useRef, useState } from "react";
import { X, Search, Loader2 } from "lucide-react";

const Searchmodal = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Close modal using Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Search products
  useEffect(() => {
    if (!searchTerm.trim()) {
      setProducts([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/products/search?q=${encodeURIComponent(searchTerm)}`
        );

        const data = await response.json();

        if (response.ok) {
          setProducts(data);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Background overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative mx-auto mt-16 w-[95%] max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Search Header */}
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <Search className="h-5 w-5 text-gray-400" />

          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for products..."
            className="flex-1 text-base outline-none placeholder:text-gray-400"
          />

          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-125 overflow-y-auto">
          {/* Empty state */}
          {!searchTerm.trim() && (
            <div className="px-6 py-12 text-center">
              <Search className="mx-auto mb-3 h-10 w-10 text-gray-300" />

              <h3 className="text-lg font-medium text-gray-900">
                Search our products
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Search for shirts, jeans, hoodies, dresses and more.
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center gap-2 px-6 py-10">
              <Loader2 className="h-5 w-5 animate-spin text-gray-500" />

              <span className="text-sm text-gray-500">
                Searching products...
              </span>
            </div>
          )}

          {/* No results */}
          {!loading && searchTerm.trim() && products.length === 0 && (
            <div className="px-6 py-12 text-center">
              <h3 className="text-base font-medium text-gray-900">
                No products found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Try searching for something else.
              </p>
            </div>
          )}

          {/* Products */}
          {!loading && products.length > 0 && (
            <div className="divide-y">
              {products.map((product) => (
                <button
                  key={product._id}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-gray-50"
                  onClick={() => {
                    window.location.href = `/product/${product.slug}`;
                  }}
                >
                  {/* Product image */}
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={product.images?.[0]}
                      alt={product.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Product information */}
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-medium text-gray-900">
                      {product.title}
                    </h4>

                    <p className="mt-1 text-sm font-semibold text-gray-700">
                      ₹{product.price}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Searchmodal;



