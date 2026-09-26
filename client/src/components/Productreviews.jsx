import { useEffect, useState } from "react";
import { StarIcon } from "@heroicons/react/20/solid";
import { toast } from "react-toastify";
import useAuth from "../customhooks/useAuth";
import { API_BASE_URL } from "../constants";

const PAGE_SIZE = 5;

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const starBarColors = {
  5: "bg-emerald-500",
  4: "bg-lime-400",
  3: "bg-yellow-400",
  2: "bg-orange-400",
  1: "bg-red-400",
};

const Productreviews = ({ productId }) => {
  const { isSignedIn, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null);
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

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const myReview = reviews.find((review) => review.clerkId === user?.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Rating only compulsory for the first review; afterwards it is
    // pre-filled and only changes if the user picks a new one
    if (!myReview && !editingId && rating === 0) {
      toast.error("Please select a star rating.");
      return;
    }
    setSubmitting(true);
    try {
      const url = editingId
        ? `${API_BASE_URL}/api/reviews/updatereview/${editingId}`
        : `${API_BASE_URL}/api/reviews/createreview`;
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
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
      toast.success(editingId ? "Review updated!" : "Review submitted!");
      setRating(0);
      setContent("");
      setEditingId(null);
      await fetchReviews();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (review) => {
    setEditingId(review._id);
    setRating(review.rating);
    setContent(review.content);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (review) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/reviews/deletereview/${review._id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clerkId: user.id }),
        }
      );
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Delete failed");
      }
      toast.success("Review deleted");
      if (editingId === review._id) {
        setEditingId(null);
        setRating(0);
        setContent("");
      }
      setReviews((prev) => prev.filter((r) => r._id !== review._id));
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Aggregate stats
  const total = reviews.length;
  const average = total
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / total
    : 0;
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((review) => review.rating === star).length,
  }));

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
            Ratings and Reviews
          </h2>
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

        {/* Aggregate rating */}
        {total > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-gray-500">Overall Rating</p>
                <p className="mt-1 text-6xl font-semibold tracking-tight text-gray-900">
                  {average.toFixed(1)}
                </p>
              </div>
              <div>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      className={classNames(
                        average >= star - 0.5 ? "text-emerald-500" : "text-gray-200",
                        "size-6"
                      )}
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Based on {total} review{total === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {breakdown.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="flex w-8 items-center gap-1 text-sm text-gray-600">
                    {star}
                    <StarIcon className="size-3.5 text-emerald-500" />
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={classNames("h-full rounded-full", starBarColors[star])}
                      style={{ width: `${total ? (count / total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm text-gray-500">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Write / edit a review */}
        {isSignedIn ? (
          <form onSubmit={handleSubmit} className="mt-8">
            <h3 className="text-sm font-medium text-gray-900">
              {editingId
                ? "Edit your review"
                : myReview
                  ? "Update your review"
                  : "Write a review"}
            </h3>
            <div className="mt-2 flex items-center gap-1">
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
            <div className="mt-3 flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting
                  ? "Submitting..."
                  : editingId || myReview
                    ? "Update review"
                    : "Submit review"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setRating(0);
                    setContent("");
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : (
          <p className="mt-8 text-sm text-gray-500">
            Please sign in to write a review.
          </p>
        )}

        {/* Comments — chat style */}
        <div className="mt-10 space-y-6">
          {paginated.length === 0 ? (
            <p className="text-sm text-gray-500">
              {filter === "mine"
                ? "You haven't reviewed this product yet."
                : "No reviews yet. Be the first to review this product!"}
            </p>
          ) : (
            paginated.map((review) => (
              <div key={review._id} className="flex gap-3">
                {/* Avatar */}
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                  {(review.userName || "A").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {review.userName || "Anonymous"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt || review.date).toLocaleDateString()}
                    </span>
                  </div>
                  {/* Chat bubble */}
                  <div className="mt-1 inline-block max-w-full rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-2.5">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className={classNames(
                            review.rating >= star
                              ? "text-yellow-400"
                              : "text-gray-300",
                            "size-3.5"
                          )}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-sm break-words text-gray-700">
                      {review.content}
                    </p>
                  </div>
                  {/* Own review actions */}
                  {user?.id === review.clerkId && (
                    <div className="mt-1 flex gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => handleEdit(review)}
                        className="underline text-gray-500 hover:text-indigo-600"
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(review)}
                        className="underline text-gray-500 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
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
