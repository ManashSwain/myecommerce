import { Link } from "react-router";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

// Shown by the catch-all route for any URL the storefront doesn't know.
// Rendered inside Rootlayout, so the navbar, footer, and chat launcher stay
// available.
const Notfound = () => {
  return (
    <main className="bg-white">
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center sm:py-32 lg:px-8">
        <span className="flex size-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/60">
          <QuestionMarkCircleIcon className="size-8" aria-hidden="true" />
        </span>

        <p className="mt-6 text-sm font-semibold tracking-wide text-indigo-600 uppercase">
          404 error
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance text-gray-900 sm:text-5xl">
          Page not found
        </h1>
        <p className="mt-4 max-w-md text-base text-pretty text-gray-600">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may
          have moved, or the link may be out of date.
        </p>

        <div className="mt-10 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Back to home
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Continue shopping
          </Link>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Still need help?{" "}
          <Link
            to="/contact"
            className="font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Contact support
          </Link>
        </p>
      </div>
    </main>
  );
};

export default Notfound;
