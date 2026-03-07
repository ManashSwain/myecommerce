import React from "react";

const Footer = () => {
  return (
    <footer className="bg-white rounded-lg shadow border border-gray-200 m-4">
      <div className="w-full max-w-7xl mx-auto p-4 md:py-8">

        <div className="sm:flex sm:items-center sm:justify-between">

          <a
            href="/"
            className="flex items-center mb-4 sm:mb-0 space-x-3"
          >
            <img
              src="https://flowbite.com/docs/images/logo.svg"
              className="h-7"
              alt="Logo"
            />
            <span className="text-2xl font-semibold text-gray-900 whitespace-nowrap">
              MyStore
            </span>
          </a>

          <ul className="flex flex-wrap items-center mb-6 text-sm font-medium text-gray-600 sm:mb-0">
            <li>
              <a href="#" className="hover:underline mr-4 md:mr-6">
                About
              </a>
            </li>

            <li>
              <a href="#" className="hover:underline mr-4 md:mr-6">
                Privacy Policy
              </a>
            </li>

            <li>
              <a href="#" className="hover:underline mr-4 md:mr-6">
                Licensing
              </a>
            </li>

            <li>
              <a href="#" className="hover:underline">
                Contact
              </a>
            </li>
          </ul>

        </div>

        <hr className="my-6 border-gray-200 sm:mx-auto lg:my-8" />

        <span className="block text-sm text-gray-500 sm:text-center">
          © {new Date().getFullYear()}{" "}
          <a href="/" className="hover:underline">
            MyStore
          </a>
          . All Rights Reserved.
        </span>

      </div>
    </footer>
  );
};

export default Footer;