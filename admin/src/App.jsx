import "./App.css";
import * as React from "react";

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import Users from "./components/Users";
import Categories from "./components/Categories";
import Subcategories from "./components/Subcategories";
import Products from "./components/Products";
import Orders from "./components/Orders";
import Toast from "./components/Toast";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <div>Dashboard</div> },
      { path: "users", element: <Users /> },
      { path: "categories", element: <Categories/>},
      { path: "sub-categories", element: <Subcategories/>},
      { path: "products", element: <Products/> },
      { path: "orders", element: <Orders/> },
    ],
  },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toast />
    </>
  );
}

export default App;
