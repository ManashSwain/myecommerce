import React from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router";

const BackToHome = () => (
  <Link
    to="/"
    className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900"
  >
    <ArrowLeftIcon aria-hidden="true" className="size-4" />
    Back to home
  </Link>
);

export default BackToHome;
