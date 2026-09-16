import React from "react";
import CategoryManager from "./CategoryManager";

// TODO: replace with data fetched from the subcategories API once deployed
const sampleSubcategories = [
  {
    id: 1,
    name: "Long Wallets",
    description: "Full-length wallets with card and cash slots.",
    image:
      "https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-04-trending-product-02.jpg",
  },
  {
    id: 2,
    name: "Pen Sets",
    description: "12-sided machined black pencil and pen sets.",
    image:
      "https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-04-trending-product-03.jpg",
  },
  {
    id: 3,
    name: "Mini Sketchbooks",
    description: "Pocket-sized sketchbooks sold in sets of three.",
    image:
      "https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-04-trending-product-04.jpg",
  },
  {
    id: 4,
    name: "Desk Organizers",
    description: "Walnut organizers with white compartments.",
    image:
      "https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-04-trending-product-01.jpg",
  },
];

const Subcategories = () => {
  return (
    <CategoryManager
      title="Sub Categories"
      singular="Sub Category"
      initialItems={sampleSubcategories}
    />
  );
};

export default Subcategories;
