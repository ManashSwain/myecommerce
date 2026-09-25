import { useEffect, useState } from "react";
import { StarIcon } from "@heroicons/react/20/solid";
import { toast } from "react-toastify";
import useAuth from "../customhooks/useAuth";
import { API_BASE_URL } from "../constants";

const PAGE_SIZE = 5;

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Productreviews = ({ productId }) => {
  const { isSignedIn, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState("newest"); // "newest" | "mine"
  const [page, setPage] = useState(1);

  const fetchReviews = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/reviews/getreviews?productId=${productId}`
      );
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setReviews([]);
        return;
      }
      setReviews(json.data || []);
    } catch (err) {
      setReviews([]);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  // Switching filters always goes back to the first page
  useEffect(() => {
    setPage(1);
  }, [filter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a star rating.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews/createreview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user.id,
          userName: user.fullName || user.username || "Anonymous",
          productId,
          rating,
          content,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Could not submit review");
      }
      toast.success("Review submitted!");
      setRating(0);
      setContent("");
      setFilter("newest");
      await fetchReviews();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const visible =
    filter === "mine"
      ? reviews.filter((review) => review.clerkId === user?.id)
      : reviews;
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const paginated = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 sm:px-6 lg:max-w-7xl lg:px-8 lg:pb-24">
      <div className="border-t border-gray-200 pt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Reviews
          </h2>
          {/* Filter buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFilter("newest")}
              className={classNames(
                filter === "newest"
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-100",
                "rounded-md px-3 py-1.5 text-sm font-medium"
              )}
            >
              Newest
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isSignedIn) {
                  toast.error("Please sign in to see your reviews.");
                  return;
                }
                setFilter("mine");
              }}
              className={classNames(
                filter === "mine"
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-100",
                "rounded-md px-3 py-1.5 text-sm font-medium"
              )}
            >
              My reviews
            </button>
          </div>
        </div>

        {/* Write a review */}
        {isSignedIn ? (
          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-lg border border-gray-200 p-5"
          >
            <h3 className="text-sm font-medium text-gray-900">
              Write a review
            </h3>
            <div className="mt-3 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                >
                  <StarIcon
                    className={classNames(
                      rating >= star ? "text-yellow-400" : "text-gray-300",
                      "size-6 hover:text-yellow-400"
                    )}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={3}
              placeholder="Share your experience with this product..."
              className="mt-3 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="mt-3 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit review"}
            </button>
          </form>
        ) : (
          <p className="mt-6 text-sm text-gray-500">
            Please sign in to write a review.
          </p>
        )}

        {/* Review list */}
        <div className="mt-8 space-y-6">
          {paginated.length === 0 ? (
            <p className="text-sm text-gray-500">
              {filter === "mine"
                ? "You haven't reviewed this product yet."
                : "No reviews yet. Be the first to review this product!"}
            </p>
          ) : (
            paginated.map((review) => (
              <div
                key={review._id}
                className="rounded-lg border border-gray-200 p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">
                    {review.userName || "Anonymous"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(review.createdAt || review.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-1 flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      className={classNames(
                        review.rating >= star
                          ? "text-yellow-400"
                          : "text-gray-200",
                        "size-4"
                      )}
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-600">{review.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {visible.length > PAGE_SIZE && (
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Previous
            </button>
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Productreviews;
