import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { API_BASE_URL } from "../constants";

const Searchmodal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
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

  // Search products (debounced)
  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/products/search?q=${encodeURIComponent(term)}`
        );
        const json = await response.json();
        if (response.ok && json.success !== false) {
          setProducts(json.data || []);
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

  // Open a product's detail page and reset the modal
  const openProduct = (product) => {
    setSearchTerm("");
    setProducts([]);
    onClose();
    navigate(`/product/${product._id}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && products.length > 0) {
      e.preventDefault();
      openProduct(products[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
      {/* Backdrop — dims the page without blurring it */}
      <div
        className="absolute inset-0 bg-gray-900/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative mt-16 w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-4">
          <MagnifyingGlassIcon
            aria-hidden="true"
            className="size-5 text-gray-400"
          />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for products..."
            className="flex-1 text-base text-gray-900 outline-none placeholder:text-gray-400"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon aria-hidden="true" className="size-5" />
          </button>
        </div>

        {/* Results */}
        <div>
          {/* Empty state */}
          {!searchTerm.trim() && (
            <div className="px-6 py-12 text-center">
              <MagnifyingGlassIcon
                aria-hidden="true"
                className="mx-auto mb-3 size-10 text-gray-300"
              />
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
              <ArrowPathIcon
                aria-hidden="true"
                className="size-5 animate-spin text-gray-500"
              />
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
            <div className="divide-y divide-gray-200">
              {products.map((product) => (
                <button
                  key={product._id}
                  className="flex w-full items-center gap-4 px-6 py-4 text-left transition hover:bg-gray-50"
                  onClick={() => openProduct(product)}
                >
                  {/* Product image */}
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="size-full object-cover"
                      />
                    ) : (
                      <PhotoIcon
                        aria-hidden="true"
                        className="size-6 text-gray-300"
                      />
                    )}
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