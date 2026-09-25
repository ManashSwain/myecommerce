import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { API_BASE_URL } from "../constants";

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

const Collections = ({ title = "Trending Right now", limit, showMoreLink = false }) => {
  const [categories, setCategories] = useState([]);
  const visibleCategories = limit ? categories.slice(0, limit) : categories;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/categories/getcategory`);
        const json = await res.json();
        setCategories(json.data || []);
      } catch (err) {
        console.error("Could not load categories:", err);
      }
    };
    fetchCategories();
  }, []);

  return (
    <>
      <div className="bg-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl py-16 sm:py-24 lg:max-w-none lg:py-32">
            <h2 className="text-2xl font-bold text-gray-900 uppercase text-center">Our Categories</h2>

            <div className="mt-6 space-y-12 lg:grid lg:grid-cols-3 lg:space-y-0 lg:gap-x-6">
              {visibleCategories.map((category) => (
                <div key={category._id} className="group relative">
                  {category.image?.[0] && (
                    <img
                      alt={category.name}
                      src={category.image[0]}
                      className="w-full rounded-lg bg-white object-cover group-hover:opacity-75 max-sm:h-80 sm:aspect-2/1 lg:aspect-square"
                    />
                  )}
                  <h3 className="mt-6 text-sm text-gray-500">
                    <Link to={`/categories/${slugify(category.name)}`}>
                      <span className="absolute inset-0" />
                      {category.name}
                    </Link>
                  </h3>
                  <p className="text-base font-semibold text-gray-900">
                    {category.description}
                  </p>
                </div>
              ))}
            </div>

            {categories.length === 0 && (
              <p className="mt-6 text-sm text-gray-500 text-center">
                No categories yet.
              </p>
            )}

            {showMoreLink && limit && categories.length > limit && (
              <div className="mt-12 text-center">
                <Link
                  to="/categories"
                  className="inline-block rounded-md bg-indigo-600 px-8 py-3 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  View other categories
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Collections;
