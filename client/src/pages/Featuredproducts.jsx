import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "react-toastify";
import BackToHome from "../components/BackToHome";
import { API_BASE_URL } from "../constants";

// Full list of featured products, opened from the homepage "See more" button.
const Featuredproducts = () => {
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

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <BackToHome />
      </div>
      <div className="mx-auto max-w-2xl px-4 pt-6 pb-16 sm:px-6 sm:pb-24 lg:max-w-7xl lg:px-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Featured Products
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          All of our hand-picked featured products.
        </p>

        {loading ? (
          <p className="mt-10 text-sm text-gray-500">
            Loading featured products...
          </p>
        ) : products.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-gray-300 py-24 text-center">
            <p className="text-sm text-gray-500">
              No featured products right now.
            </p>
            <Link
              to="/shop"
              className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Browse the shop &rarr;
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
            {products.map((product) => (
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
        )}
      </div>
    </div>
  );
};

export default Featuredproducts;
