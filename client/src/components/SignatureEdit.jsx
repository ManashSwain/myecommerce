import { useEffect, useState } from "react";
import { Link } from "react-router";
import { API_BASE_URL } from "../constants";

// Homepage "Most Loved Ones" banner.
// The 4 product cards are the top-selling products of the current month,
// computed server-side from real orders (no static / hardcoded data).
const CARD_LIMIT = 4;

const formatPrice = (amount) => `$${Number(amount || 0)}`;

const SignatureEdit = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopSelling = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/products/topselling?limit=${CARD_LIMIT}&period=month`,
        );
        const json = await res.json();
        if (res.ok && json.success !== false) {
          setProducts(json.data || []);
        } else {
          setProducts([]);
        }
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTopSelling();
  }, []);

  return (
    <div className="bg-white">
      {/* Banner — brown gradient, headline on the left, image on the right */}
      <div className="relative overflow-hidden bg-linear-to-r from-[#221910] via-[#4d3a29] to-[#cbb49c]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-stretch gap-8 lg:grid-cols-2">
            <div className="flex flex-col justify-center py-16 sm:py-20 lg:py-28">
              <h2 className="text-4xl font-light tracking-tight text-white uppercase sm:text-6xl lg:text-7xl">
                Most
                <br />
                Loved Ones
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Cards — negative top margin pulls them up so they sit half on the
          banner and half on the page below. Grid is always 4 columns on
          large screens. */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-5">
        {loading ? (
          <div className="relative z-10 -mt-24 grid grid-cols-2 gap-x-6 gap-y-10 sm:-mt-32 lg:grid-cols-4 xl:gap-x-8">
            {Array.from({ length: CARD_LIMIT }).map((_, i) => (
              <div key={i} className="group relative animate-pulse">
                <div className="aspect-square w-full rounded-md bg-gray-200 lg:aspect-auto lg:h-80" />
                <div className="mt-4 flex justify-between">
                  <div className="w-2/3 space-y-2">
                    <div className="h-4 rounded bg-gray-200" />
                    <div className="h-3 w-1/2 rounded bg-gray-100" />
                  </div>
                  <div className="h-4 w-10 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="relative z-10 -mt-24 rounded-lg border border-dashed border-white/40 bg-white/80 px-6 py-16 text-center sm:-mt-32">
            <p className="text-sm text-gray-600">
              No loved ones to show yet — check back soon.
            </p>
          </div>
        ) : (
          <div className="relative z-10 -mt-24 grid grid-cols-2 gap-x-6 gap-y-10 sm:-mt-32 lg:grid-cols-4 xl:gap-x-8">
            {products.slice(0, CARD_LIMIT).map((product) => (
              <div key={product._id} className="group relative">
                {product.image && (
                  <img
                    alt={product.title}
                    src={product.image}
                    className="aspect-square w-full rounded-md bg-gray-200 object-cover shadow-lg lg:aspect-auto lg:h-80"
                  />
                )}
                <div className="mt-4 flex justify-between">
                  <div>
                    <h3 className="text-sm text-gray-700">
                      <Link to={`/product/${product._id}`}>
                        <span aria-hidden="true" className="absolute inset-0" />
                        {product.title}
                      </Link>
                    </h3>
                    {product.color && (
                      <p className="mt-1 text-sm text-gray-500">
                        {product.color}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Breathing room under the overlapping cards */}
      <div className="pb-16 sm:pb-24" />
    </div>
  );
};

export default SignatureEdit;

