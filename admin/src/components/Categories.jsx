import React from "react";
import CategoryManager from "./CategoryManager";

const categoryEndpoints = {
  getAll: "/api/categories/getcategory",
  create: "/api/categories/createcategory",
  update: (id) => `/api/categories/updatecategory/${id}`,
  remove: (id) => `/api/categories/deletecategory/${id}`,
};

const Categories = () => {
  return (
    <CategoryManager
      title="Categories"
      singular="Category"
      endpoints={categoryEndpoints}
    />
  );
};

export default Categories;
