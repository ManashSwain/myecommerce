import { useEffect, useState } from "react";
import { HeartIcon, TrashIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router";
import { toast } from "react-toastify";
import useAuth from "../customhooks/useAuth";
import BackToHome from "../components/BackToHome";
import { API_BASE_URL } from "../constants";

const Wishlistpage = () => {
  const { isSignedIn, isLoaded, user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/wishlist/${user.id}`);
      const json = await res.json();
      if (res.status === 404) {
        // No wishlist yet — same as an empty one
        setItems([]);
        return;
      }
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Could not load wishlist");
      }
      setItems(json.data?.items || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, [isSignedIn, user?.id]);

  const handleRemove = async (item) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/wishlist/${user.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.product._id,
          color: item.color,
          size: item.size,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Remove failed");
      }
      toast.success("Removed from wishlist");
      setItems(json.data?.items || []);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddToBag = async (item) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/cart/createcart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          productId: item.product._id,
          quantity: 1,
          color: item.color,
          size: item.size,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Could not add to bag");
      }
      toast.success("Added to bag!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <p className="text-sm text-gray-500">
            Please sign in to view your wishlist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <BackToHome />
      </div>
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6 sm:pb-24 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Wishlist
        </h2>

        {loading ? (
          <p className="mt-10 text-sm text-gray-500">Loading wishlist...</p>
        ) : items.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-24 text-center">
            <HeartIcon aria-hidden="true" className="size-10 text-gray-300" />
            <p className="mt-4 text-sm text-gray-500">
              Your wishlist is empty. Items you save will show up here.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8">
            {items.map((item) => (
              <div key={item._id} className="group relative">
                <Link to={`/product/${item.product._id}`}>
                  {item.product.images?.[0] && (
                    <img
                      alt={item.product.title}
                      src={item.product.images[0]}
                      className="aspect-square w-full rounded-md bg-gray-200 object-cover group-hover:opacity-75"
                    />
                  )}
                </Link>
                <h3 className="mt-4 text-sm font-medium text-gray-900">
                  <Link to={`/product/${item.product._id}`}>
                    {item.product.title}
                  </Link>
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  {item.color} · {item.size}
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  ${item.product.price}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleAddToBag(item)}
                    className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                  >
                    <ShoppingBagIcon aria-hidden="true" className="size-3.5" />
                    Add to bag
                  </button>
                  <button
                    onClick={() => handleRemove(item)}
                    className="flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <TrashIcon aria-hidden="true" className="size-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlistpage;
