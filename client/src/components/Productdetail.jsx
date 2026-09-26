import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { StarIcon } from "@heroicons/react/20/solid";
import { ArrowLeftIcon, HeartIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import useAuth from "../customhooks/useAuth";
import Productreviews from "./Productreviews";
import { API_BASE_URL } from "../constants";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Productdetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { isSignedIn, user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/products/getproduct/${productId}`
        );
        const json = await res.json();
        if (!res.ok || json.success === false) {
          setNotFound(true);
          return;
        }
        const data = json.data;
        setProduct(data);
        // Preselect the first color and its first in-stock size
        const colors = [...new Set((data.variants || []).map((v) => v.color))];
        const firstColor = colors[0] || "";
        setSelectedColor(firstColor);
        const firstVariant = (data.variants || []).find(
          (v) => v.color === firstColor && v.stock > 0
        );
        setSelectedSize(firstVariant?.size || "");
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleColorChange = (color) => {
    setSelectedColor(color);
    // Keep the size if it exists for this color, else pick the first available
    const stillAvailable = (product.variants || []).some(
      (v) => v.color === color && v.size === selectedSize && v.stock > 0
    );
    if (!stillAvailable) {
      const firstInStock = (product.variants || []).find(
        (v) => v.color === color && v.stock > 0
      );
      setSelectedSize(firstInStock?.size || "");
    }
  };

  const handleAddToBag = async (e) => {
    e.preventDefault();
    if (!isSignedIn) {
      setFeedback({ type: "error", message: "Please sign in to add items to your bag." });
      return;
    }
    if (!selectedColor || !selectedSize) {
      setFeedback({ type: "error", message: "Please select a color and size." });
      return;
    }
    setAdding(true);
    setFeedback({ type: "", message: "" });
    try {
      const res = await fetch(`${API_BASE_URL}/api/cart/createcart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          productId: productId,
          quantity: 1,
          color: selectedColor,
          size: selectedSize,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Could not add to bag");
      }
      setFeedback({ type: "success", message: "Added to bag!" });
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setAdding(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to save items to your wishlist.");
      return;
    }
    if (!selectedColor || !selectedSize) {
      toast.error("Please select a color and size.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          productId: productId,
          color: selectedColor,
          size: selectedSize,
        }),
      });
      const json = await res.json();
      if (res.status === 409) {
        toast.info("This item is already in your wishlist.");
        return;
      }
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Could not add to wishlist");
      }
      toast.success("Added to wishlist!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <p className="text-sm text-gray-500">Loading product...</p>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <p className="text-sm text-gray-500">Product not found.</p>
        </div>
      </div>
    );
  }

  const images = product.images || [];
  const colors = [...new Set((product.variants || []).map((v) => v.color))];
  // Every size this product comes in, across all colors
  const allSizes = [...new Set((product.variants || []).map((v) => v.size))];
  // A size is selectable only if the selected color has it in stock
  const isSizeAvailable = (size) =>
    (product.variants || []).some(
      (v) => v.color === selectedColor && v.size === size && v.stock > 0
    );

  return (
    <>
      <div className="bg-white">
        <div className="pt-6">
          <div className="mx-auto max-w-2xl px-4 pb-4 sm:px-6 lg:max-w-7xl lg:px-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              <ArrowLeftIcon aria-hidden="true" className="size-4" />
              Back
            </button>
          </div>
          <nav aria-label="Breadcrumb">
            <ol role="list" className="mx-auto flex max-w-2xl items-center space-x-2 px-4 sm:px-6 lg:max-w-7xl lg:px-8">
              <li>
                <div className="flex items-center">
                  <Link to="/shop" className="mr-2 text-sm font-medium text-gray-900">
                    {product.category?.name || "Shop"}
                  </Link>
                  <svg
                    fill="currentColor"
                    width={16}
                    height={20}
                    viewBox="0 0 16 20"
                    aria-hidden="true"
                    className="h-5 w-4 text-gray-300"
                  >
                    <path d="M5.697 4.34L8.98 16.532h1.327L7.025 4.341H5.697z" />
                  </svg>
                </div>
              </li>
              {product.subcategory?.name && (
                <li>
                  <div className="flex items-center">
                    <span className="mr-2 text-sm font-medium text-gray-900">
                      {product.subcategory.name}
                    </span>
                    <svg
                      fill="currentColor"
                      width={16}
                      height={20}
                      viewBox="0 0 16 20"
                      aria-hidden="true"
                      className="h-5 w-4 text-gray-300"
                    >
                      <path d="M5.697 4.34L8.98 16.532h1.327L7.025 4.341H5.697z" />
                    </svg>
                  </div>
                </li>
              )}
              <li className="text-sm">
                <span aria-current="page" className="font-medium text-gray-500">
                  {product.title}
                </span>
              </li>
            </ol>
          </nav>

          {/* Image gallery */}
          <div className="mx-auto mt-6 max-w-2xl sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-3 lg:gap-8 lg:px-8">
            {images[0] && (
              <img
                alt={product.title}
                src={images[0]}
                className="row-span-2 aspect-3/4 size-full rounded-lg object-cover max-lg:hidden"
              />
            )}
            {images[1] && (
              <img
                alt={product.title}
                src={images[1]}
                className="col-start-2 aspect-3/2 size-full rounded-lg object-cover max-lg:hidden"
              />
            )}
            {images[2] && (
              <img
                alt={product.title}
                src={images[2]}
                className="col-start-2 row-start-2 aspect-3/2 size-full rounded-lg object-cover max-lg:hidden"
              />
            )}
            {images.length > 0 && (
              <img
                alt={product.title}
                src={images[3] || images[0]}
                className="row-span-2 aspect-4/5 size-full object-cover sm:rounded-lg lg:aspect-3/4"
              />
            )}
          </div>

          {/* Product info */}
          <div className="mx-auto max-w-2xl px-4 pt-10 pb-16 sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-3 lg:grid-rows-[auto_auto_1fr] lg:gap-x-8 lg:px-8 lg:pt-16 lg:pb-24">
            <div className="lg:col-span-2 lg:border-r lg:border-gray-200 lg:pr-8">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                {product.title}
              </h1>
            </div>

            {/* Options */}
            <div className="mt-4 lg:row-span-3 lg:mt-0">
              <h2 className="sr-only">Product information</h2>
              <p className="text-3xl tracking-tight text-gray-900">
                ₹{product.price}
              </p>

              {/* Rating */}
              <div className="mt-6">
                <h3 className="sr-only">Reviews</h3>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      aria-hidden="true"
                      className={classNames(
                        product.rating >= star ? "text-yellow-400" : "text-gray-200",
                        "size-5 shrink-0"
                      )}
                    />
                  ))}
                </div>
              </div>

              <form className="mt-10" onSubmit={handleAddToBag}>
                {/* Colors — from variants */}
                {colors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Color</h3>
                    <fieldset aria-label="Choose a color" className="mt-4">
                      <div className="flex items-center gap-x-3">
                        {colors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => handleColorChange(color)}
                            aria-label={color}
                            title={color}
                            style={{ backgroundColor: color.toLowerCase() }}
                            className={classNames(
                              selectedColor === color
                                ? "outline-2 outline-offset-2 outline-indigo-600"
                                : "outline -outline-offset-1 outline-black/10",
                              "size-8 rounded-full outline"
                            )}
                          />
                        ))}
                      </div>
                    </fieldset>
                  </div>
                )}

                {/* Sizes — for the selected color, out-of-stock disabled */}
                {allSizes.length > 0 && (
                  <div className="mt-10">
                    <h3 className="text-sm font-medium text-gray-900">Size</h3>
                    <fieldset aria-label="Choose a size" className="mt-4">
                      <div className="grid grid-cols-4 gap-3">
                        {allSizes.map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSize(size)}
                            disabled={!isSizeAvailable(size)}
                            className={classNames(
                              selectedSize === size && isSizeAvailable(size)
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50",
                              "rounded-md border p-3 text-sm font-medium uppercase disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
                            )}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                )}

                <div className="mt-10 flex gap-3">
                  <button
                    type="submit"
                    disabled={adding}
                    className="flex flex-1 items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden disabled:opacity-50"
                  >
                    {adding ? "Adding..." : "Add to bag"}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddToWishlist}
                    aria-label="Add to wishlist"
                    className="flex items-center justify-center rounded-md border border-gray-300 px-4 text-gray-400 hover:border-red-300 hover:text-red-500"
                  >
                    <HeartIcon aria-hidden="true" className="size-6" />
                  </button>
                </div>
                {feedback.message && (
                  <p
                    className={classNames(
                      feedback.type === "success" ? "text-green-600" : "text-red-600",
                      "mt-3 text-sm text-center"
                    )}
                  >
                    {feedback.message}
                  </p>
                )}
              </form>
            </div>

            <div className="py-10 lg:col-span-2 lg:col-start-1 lg:border-r lg:border-gray-200 lg:pt-6 lg:pr-8 lg:pb-16">
              {/* Description */}
              <div>
                <h3 className="sr-only">Description</h3>
                <div className="space-y-6">
                  <p className="text-base text-gray-900">{product.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Productreviews productId={productId} />
    </>
  );
};

export default Productdetail;
