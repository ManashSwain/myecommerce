import "./App.css";
import * as React from "react";

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import Users from "./components/Users";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <div>Dashboard</div> },
      { path: "users", element: <Users /> },
      { path: "categories", element: <div>Categories</div> },
      { path: "sub-categories", element: <div>Sub categories</div> },
      { path: "products", element: <div>Products</div> },
      { path: "orders", element: <div>Orders</div> },
    ],
  },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
