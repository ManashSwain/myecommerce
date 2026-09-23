import React from "react";
import { Link } from "react-router";

const SignatureEdit = () => {
  const products = [
    {
      id: 1,
      name: "Basic Tee",
      href: "#",
      imageSrc:
        "https://tailwindcss.com/plus-assets/img/ecommerce-images/product-page-01-related-product-01.jpg",
      imageAlt: "Front of men's Basic Tee in black.",
      price: "$35",
      color: "Black",
    },
    {
      id: 2,
      name: "Basic Tee",
      href: "#",
      imageSrc:
        "https://tailwindcss.com/plus-assets/img/ecommerce-images/product-page-01-related-product-02.jpg",
      imageAlt: "Front of men's Basic Tee in white.",
      price: "$35",
      color: "Aspen White",
    },
    {
      id: 3,
      name: "Basic Tee",
      href: "#",
      imageSrc:
        "https://tailwindcss.com/plus-assets/img/ecommerce-images/product-page-01-related-product-03.jpg",
      imageAlt: "Front of men's Basic Tee in dark gray.",
      price: "$35",
      color: "Charcoal",
    },
    {
      id: 4,
      name: "Artwork Tee",
      href: "#",
      imageSrc:
        "https://tailwindcss.com/plus-assets/img/ecommerce-images/product-page-01-related-product-04.jpg",
      imageAlt:
        "Front of men's Artwork Tee in peach with white and brown dots forming an isometric cube.",
      price: "$35",
      color: "Iso Dots",
    },
  ];

  return (
    <div className="bg-white">
      {/* Banner — brown gradient, headline on the left, image on the right */}
      <div className="relative overflow-hidden bg-linear-to-r from-[#221910] via-[#4d3a29] to-[#cbb49c]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-stretch gap-8 lg:grid-cols-2">
            <div className="flex flex-col justify-center py-16 sm:py-20 lg:py-28">
              <h2 className="text-4xl font-light tracking-tight text-white uppercase sm:text-6xl lg:text-7xl">
                Signature
                <br />
                Online Edit
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Cards — negative top margin pulls them up so they sit half on the
          banner and half on the page below */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-5">
        <div className="relative z-10 -mt-24 grid grid-cols-2 gap-x-6 gap-y-10 sm:-mt-32 lg:grid-cols-4 xl:gap-x-8">
          {products.map((product) => (
            <div key={product.id} className="group relative">
              <img
                alt={product.imageAlt}
                src={product.imageSrc}
                className="aspect-square w-full rounded-md bg-gray-200 object-cover shadow-lg  lg:aspect-auto lg:h-80"
              />
              <div className="mt-4 flex justify-between">
                <div>
                  <h3 className="text-sm text-gray-700">
                    <Link to={`/product/${product.id}`}>
                      <span aria-hidden="true" className="absolute inset-0" />
                      {product.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{product.color}</p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {product.price}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Breathing room under the overlapping cards */}
      <div className="pb-16 sm:pb-24" />
    </div>
  );
};

export default SignatureEdit;
