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
import LoggedOut from "./components/LoggedOut";
import { useAuth0 } from "@auth0/auth0-react";

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
  const {
    isLoading, // SDK is reaching Auth0 on load
    isAuthenticated,
    error,
    loginWithRedirect: login, // Starts the login flow
  } = useAuth0();

  // If the user isn't authenticated, send them straight to the Auth0
  // Universal Login page instead of showing a manual "Login" button.
  // Exception: the "/logged-out" route must stay visible after logout, so we
  // don't auto-redirect there.
  const isLoggedOutRoute = window.location.pathname === "/logged-out";

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated && !error && !isLoggedOutRoute) {
      login({ appState: { returnTo: window.location.pathname } });
    }
  }, [isLoading, isAuthenticated, error, login, isLoggedOutRoute]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-red-600">Authentication error: {error.message}</p>
      </div>
    );
  }

  // Logged-out landing page (shown right after logout; not auto-redirected).
  if (isLoggedOutRoute) {
    return <LoggedOut />;
  }

  // Not authenticated yet → the effect above is redirecting to Auth0.
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Redirecting to login…
      </div>
    );
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toast />
    </>
  );
}

export default App;

