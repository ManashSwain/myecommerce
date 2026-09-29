import { Link } from "react-router";

// Full-width promotional banner shown between product collections.
// Single conversion-oriented band — headline + supporting line + CTA.
const Promobanner = () => {
  return (
    <section className="bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <p className="text-sm font-semibold tracking-widest text-indigo-400 uppercase">
            Limited time offer
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white uppercase sm:text-4xl lg:text-5xl">
            Free shipping on orders over ₹999
          </h2>
          <p className="mt-4 max-w-2xl text-base text-gray-300">
            Or up to 40% off selected styles — shop the styles everyone's
            loving before they're gone.
          </p>
          <Link
            to="/shop"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-indigo-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Shop now
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Promobanner;
