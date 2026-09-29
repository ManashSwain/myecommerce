import { useEffect, useMemo, useState } from "react";
import { StarIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { toast } from "react-toastify";
import ConfirmModal from "./ConfirmModal";
import { API_BASE_URL } from "../constants";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

// Admin reviews section (shown below Orders).
// Lists every product review and lets the admin post a public reply that is
// displayed to everyone on the product page.
const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Per-review reply drafts, keyed by review id. Initialised from the server
  // value so existing replies show up pre-filled.
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [clearTarget, setClearTarget] = useState(null);

  const fetchData = async () => {
    try {
      const [reviewRes, productRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/reviews/getreviews`),
        fetch(`${API_BASE_URL}/api/products/getallproducts`),
      ]);
      const reviewJson = await reviewRes.json();
      const productJson = await productRes.json();
      const list = reviewJson.data || [];
      setReviews(list);
      setProducts(productJson.data || []);
      // Seed drafts with any existing replies.
      const seeded = {};
      list.forEach((r) => {
        seeded[r._id] = r.adminReply || "";
      });
      setDrafts(seeded);
    } catch (err) {
      setError("Could not load reviews. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Map productId -> product (title / image) for display.
  const productById = useMemo(() => {
    const map = new Map();
    products.forEach((p) => map.set(String(p._id), p));
    return map;
  }, [products]);

  const filteredReviews = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return reviews;
    return reviews.filter((review) => {
      const product = productById.get(String(review.productId));
      return [
        review.userName,
        review.content,
        review.adminReply,
        product?.title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [reviews, search, productById]);

  // `overrideReply` lets callers (e.g. "remove reply") pass a value without
  // waiting for the drafts state to update.
  const saveReply = async (review, overrideReply) => {
    const reply = (
      overrideReply !== undefined
        ? overrideReply
        : drafts[review._id] || ""
    ).trim();
    setSavingId(review._id);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/reviews/admin/reply/${review._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reply }),
        }
      );
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Could not save reply");
      }
      const updated = json.data;
      setReviews((prev) =>
        prev.map((r) => (r._id === updated._id ? updated : r))
      );
      setDrafts((prev) => ({ ...prev, [review._id]: updated.adminReply || "" }));
      toast.success(reply ? "Reply posted!" : "Reply removed");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const confirmClear = async () => {
    const review = clearTarget;
    setClearTarget(null);
    if (!review) return;
    // Clear the draft, then submit an empty reply to remove it.
    setDrafts((prev) => ({ ...prev, [review._id]: "" }));
    await saveReply(review, "");
  };

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              Reviews
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Reply to customer reviews. Replies are public and appear under
              the review on the product page.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-sm">
            <MagnifyingGlassIcon
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user, product or comment"
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pr-3 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {search.trim() && (
            <p className="shrink-0 text-sm text-gray-500">
              {filteredReviews.length} of {reviews.length} shown
            </p>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-8 text-sm text-gray-500">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="mt-8 text-sm text-gray-500">
            No reviews yet. Reviews from customers will appear here.
          </p>
        ) : filteredReviews.length === 0 ? (
          <p className="mt-8 text-sm text-gray-500">
            No reviews match "{search.trim()}".
          </p>
        ) : (
          <div className="mt-6 space-y-6">
            {filteredReviews.map((review) => {
              const product = productById.get(String(review.productId));
              const replyText = drafts[review._id] ?? "";
              const hasReply = Boolean(review.adminReply);
              const changed = replyText.trim() !== (review.adminReply || "");
              return (
                <div
                  key={review._id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-xs sm:p-6"
                >
                  <div className="flex gap-4">
                    {/* Product thumbnail */}
                    <div className="shrink-0">
                      {product?.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="size-14 rounded-md bg-gray-100 object-cover"
                        />
                      ) : (
                        <div className="flex size-14 items-center justify-center rounded-md bg-gray-100 text-xs text-gray-400">
                          N/A
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {product?.title || "Unknown product"}
                          </p>
                          <p className="text-xs text-gray-500">
                            by {review.userName || "Anonymous"} ·{" "}
                            {new Date(
                              review.createdAt || review.date
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon
                              key={star}
                              aria-hidden="true"
                              className={classNames(
                                review.rating >= star
                                  ? "text-yellow-400"
                                  : "text-gray-200",
                                "size-4 shrink-0"
                              )}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="mt-2 text-sm wrap-break-word text-gray-700">
                        {review.content}
                      </p>

                      {/* Existing reply indicator */}
                      {hasReply && (
                        <div className="mt-3 rounded-md bg-indigo-50 px-3 py-2">
                          <p className="text-xs font-semibold text-indigo-700">
                            Your reply ·{" "}
                            {review.adminRepliedAt
                              ? new Date(
                                  review.adminRepliedAt
                                ).toLocaleDateString()
                              : ""}
                          </p>
                          <p className="mt-0.5 text-sm wrap-break-word text-gray-700">
                            {review.adminReply}
                          </p>
                        </div>
                      )}

                      {/* Reply editor */}
                      <div className="mt-3">
                        <label
                          htmlFor={`reply-${review._id}`}
                          className="block text-xs font-medium text-gray-700"
                        >
                          {hasReply ? "Edit your reply" : "Reply to this review"}
                        </label>
                        <textarea
                          id={`reply-${review._id}`}
                          rows={2}
                          value={replyText}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [review._id]: e.target.value,
                            }))
                          }
                          placeholder="Write a public reply..."
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            disabled={savingId === review._id || !changed}
                            onClick={() => saveReply(review)}
                            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {savingId === review._id
                              ? "Saving..."
                              : hasReply
                                ? "Update reply"
                                : "Post reply"}
                          </button>
                          {hasReply && (
                            <button
                              type="button"
                              disabled={savingId === review._id}
                              onClick={() => setClearTarget(review)}
                              className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              Remove reply
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!clearTarget}
        title="Remove reply"
        message="Remove your public reply from this review? Customers will no longer see it."
        confirmLabel="Yes, remove reply"
        onConfirm={confirmClear}
        onCancel={() => setClearTarget(null)}
      />
    </div>
  );
};

export default Reviews;
