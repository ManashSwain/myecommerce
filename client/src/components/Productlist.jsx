import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../constants";

// Homepage "Our Featured Products" section.
// Shows the first 4 featured products and, when there are more,
// a button that opens the full list at /featured-products.
const HOMEPAGE_LIMIT = 4;

const Productlist = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/getallproducts`);
        const json = await res.json();
        const featured = (json.data || []).filter(
          (product) => product.isFeatured
        );
        setProducts(featured);
      } catch (err) {
        toast.error("Could not load featured products.");
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const visibleProducts = products.slice(0, HOMEPAGE_LIMIT);
  const hasMore = products.length > HOMEPAGE_LIMIT;

  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <h2 className="text-2xl font-bold text-center tracking-tight text-gray-900">
          Our Featured Products
        </h2>

        {loading ? (
          <p className="mt-6 text-center text-sm text-gray-500">
            Loading featured products...
          </p>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
              {visibleProducts.map((product) => (
                <div key={product._id} className="group relative">
                  <Link to={`/product/${product._id}`}>
                    {product.images?.[0] && (
                      <img
                        alt={product.title}
                        src={product.images[0]}
                        className="aspect-square w-full rounded-md bg-gray-200 object-cover group-hover:opacity-75 lg:aspect-auto lg:h-80"
                      />
                    )}
                  </Link>
                  <div className="mt-4 flex justify-between">
                    <div>
                      <h3 className="text-sm text-gray-700">
                        <Link to={`/product/${product._id}`}>
                          {product.title}
                        </Link>
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {product.category?.name}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      ${product.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="mt-12 text-center">
                <Link
                  to="/featured-products"
                  className="inline-block rounded-md bg-indigo-600 px-8 py-3 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  See more
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Productlist;
