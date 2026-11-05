import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";

// Shown by the catch-all route for any admin URL that doesn't exist. Rendered
// inside the dashboard layout, so the navbar and sidebar stay available.
const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center py-10">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-8 ring-blue-50/60">
          <Compass size={26} aria-hidden="true" />
        </span>

        <p className="mt-6 text-xs font-semibold tracking-wide text-blue-600 uppercase">
          404 error
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Page not found
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          The admin page you&apos;re looking for doesn&apos;t exist or may have
          moved. Check the URL, or head back to the dashboard.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Back to dashboard
          </Link>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Go back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
