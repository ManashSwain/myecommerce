import { MapPinIcon } from "@heroicons/react/24/outline";

const Savedaddressespage = () => {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Saved addresses
        </h2>
        <div className="mt-10 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-24 text-center">
          <MapPinIcon aria-hidden="true" className="size-10 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">
            No saved addresses yet. Addresses you add will show up here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Savedaddressespage;
