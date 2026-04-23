import "./App.css";
import * as React from "react";

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <RootLayout/>
    ),
  },
  {
    path: "about",
    element: <div>About</div>,
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
