import React from "react";
import CategoryManager from "./CategoryManager";

const subcategoryEndpoints = {
  getAll: "/api/subcategories/getsubcategory",
  create: "/api/subcategories/createsubcategory",
  update: (id) => `/api/subcategories/updatesubcategory/${id}`,
  remove: (id) => `/api/subcategories/deletesubcategory/${id}`,
};

const Subcategories = () => {
  return (
    <CategoryManager
      title="Sub Categories"
      singular="Sub Category"
      endpoints={subcategoryEndpoints}
    />
  );
};

export default Subcategories;
