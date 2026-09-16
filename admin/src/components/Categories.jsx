import React from "react";
import CategoryManager from "./CategoryManager";

// TODO: replace with data fetched from the categories API once deployed
const sampleCategories = [
  {
    id: 1,
    name: "Wallets",
    description: "Hand-stitched leather wallets in natural finishes.",
    image:
      "https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-04-trending-product-02.jpg",
  },
  {
    id: 2,
    name: "Stationery",
    description: "Machined pen and pencil sets built to last.",
    image:
      "https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-04-trending-product-03.jpg",
  },
  {
    id: 3,
    name: "Sketchbooks",
    description: "Mini sketchbooks in light and dark brown sets.",
    image:
      "https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-04-trending-product-04.jpg",
  },
  {
    id: 4,
    name: "Organizers",
    description: "Walnut organizer sets with multiple compartments.",
    image:
      "https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-04-trending-product-01.jpg",
  },
];

const Categories = () => {
  return (
    <CategoryManager
      title="Categories"
      singular="Category"
      initialItems={sampleCategories}
    />
  );
};

export default Categories;
