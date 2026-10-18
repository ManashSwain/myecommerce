import React from "react";
import { Link } from "react-router";
import logo from "../../assets/styloandcologo.png";

const Footer = () => {
  return (
    <footer className="bg-white  shadow border border-gray-200 ">
      <div className="w-full max-w-7xl mx-auto p-4 md:py-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <Link to="/" className="flex items-center space-x-3">
              <img src={logo} className="h-9 w-auto" alt="styloandco" />
              <span className="text-2xl font-bold tracking-tight text-gray-900 whitespace-nowrap">
                styloandco
              </span>
            </Link>
            <p className="mt-2 text-sm text-gray-500">Style That Speaks</p>
          </div>
          <ul className="flex flex-wrap items-center mb-6 text-sm font-medium text-gray-600 sm:mb-0">
            <li>
              <a href="/about" className="hover:underline mr-4 md:mr-6">
                About
              </a>
            </li>

            <li>
              <a href="/policy" className="hover:underline mr-4 md:mr-6">
                Privacy Policy
              </a>
            </li>

            <li>
              <a href="/licensing" className="hover:underline mr-4 md:mr-6">
                Licensing
              </a>
            </li>

            <li>
              <a href="/contact" className="hover:underline">
                Contact
              </a>
            </li>
          </ul>
        </div>

        <hr className="my-6 border-gray-200 sm:mx-auto lg:my-8" />

        <span className="block text-sm text-gray-500 sm:text-center">
          © {new Date().getFullYear()}{" "}
          <a href="/" className="hover:underline">
            styloandco
          </a>
          . All Rights Reserved.
        </span>
      </div>
    </footer>
  );
};

export default Footer;

