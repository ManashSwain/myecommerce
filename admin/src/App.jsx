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
import Reviews from "./components/Reviews";
import Dashboard from "./components/Dashboard";
import Toast from "./components/Toast";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "users", element: <Users /> },
      { path: "categories", element: <Categories/>},
      { path: "sub-categories", element: <Subcategories/>},
      { path: "products", element: <Products/> },
      { path: "orders", element: <Orders/> },
      { path: "reviews", element: <Reviews/> },
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

