import "./App.css";
import * as React from "react";

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import Users from "./components/Users";
import Admins from "./components/Admins";
import Categories from "./components/Categories";
import Subcategories from "./components/Subcategories";
import Products from "./components/Products";
import Orders from "./components/Orders";
import Reviews from "./components/Reviews";
import Tickets from "./components/Tickets";
import Dashboard from "./components/Dashboard";
import Toast from "./components/Toast";
import LoggedOut from "./components/LoggedOut";
import AccessDenied from "./components/AccessDenied";
import { useAuth0 } from "@auth0/auth0-react";
import { AdminSessionProvider } from "./context/AdminSessionProvider";
import { getMyAdmin } from "./utils/admins";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "users", element: <Users /> },
      { path: "admins", element: <Admins /> },
      { path: "categories", element: <Categories/>},
      { path: "sub-categories", element: <Subcategories/>},
      { path: "products", element: <Products/> },
      { path: "orders", element: <Orders/> },
      { path: "tickets", element: <Tickets/> },
      { path: "reviews", element: <Reviews/> },
    ],
  },
]);

// Server responses that mean "authenticated, but not allowed in". Anything
// else (network down, invalid token, server error) is a retryable failure.
const DENIAL_CODES = new Set([
  "NOT_AN_ADMIN",
  "ADMIN_DISABLED",
  "EMAIL_NOT_VERIFIED",
  "EMAIL_ALREADY_LINKED",
]);

const FullScreenMessage = ({ title, children }) => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 px-4 text-center">
    <p className="text-sm font-medium text-gray-700">{title}</p>
    {children && (
      <div className="max-w-md text-sm text-gray-500">{children}</div>
    )}
  </div>
);

const secondaryButton =
  "rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50";
const primaryButton =
  "rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700";

function App() {
  const {
    isLoading, // SDK is reaching Auth0 on load
    isAuthenticated,
    error,
    user,
    loginWithRedirect: login, // Starts the login flow
    logout,
    getIdTokenClaims,
  } = useAuth0();

  // If the user isn't authenticated, send them straight to the Auth0
  // Universal Login page instead of showing a manual "Login" button.
  // Exception: the "/logged-out" route must stay visible after logout, so we
  // don't auto-redirect there.
  const isLoggedOutRoute = window.location.pathname === "/logged-out";

  // Session state is only "allowed" after the API confirms the Auth0 identity
  // is on the admin allow-list. The router is never mounted otherwise.
  const [session, setSession] = React.useState({
    status: "idle", // idle | checking | allowed | denied | error
    admin: null,
    token: "",
    message: "",
    code: "",
  });
  // Bumping this re-runs the access check ("Check again").
  const [attempt, setAttempt] = React.useState(0);

  const handleLogout = React.useCallback(
    () =>
      logout({
        logoutParams: {
          returnTo: `${window.location.origin}/logged-out`,
        },
      }),
    [logout],
  );

  // Re-run the allow-list check. State is set here (an event handler), not in
  // the effect body, so React doesn't cascade renders.
  const retryAccessCheck = React.useCallback(() => {
    setSession((current) => ({
      ...current,
      status: "checking",
      message: "",
      code: "",
    }));
    setAttempt((current) => current + 1);
  }, []);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated && !error && !isLoggedOutRoute) {
      login({
        appState: { returnTo: window.location.pathname },
        // New admins are added by email first; the panel is not a sign-up
        // surface. (Disable sign-ups fully in the Auth0 tenant settings.)
        authorizationParams: { screen_hint: "login" },
      });
    }
  }, [isLoading, isAuthenticated, error, login, isLoggedOutRoute]);

  React.useEffect(() => {
    if (isLoading || !isAuthenticated || error || isLoggedOutRoute) {
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        // The SPA has no custom API audience, so the ID token is the signed
        // credential that carries the email the allow-list matches on.
        const claims = await getIdTokenClaims();
        const token = claims?.__raw;
        if (!token) {
          throw new Error(
            "Your Auth0 session is missing an ID token. Please sign in again.",
          );
        }

        const result = await getMyAdmin(token);
        if (!cancelled) {
          setSession({
            status: "allowed",
            admin: result.data,
            token,
            message: "",
            code: "",
          });
        }
      } catch (err) {
        if (cancelled) return;
        if (DENIAL_CODES.has(err.code)) {
          setSession({
            status: "denied",
            admin: null,
            token: "",
            message: err.message,
            code: err.code,
          });
        } else {
          setSession({
            status: "error",
            admin: null,
            token: "",
            message:
              err.message ||
              "Could not verify admin access. Check that the API is running.",
            code: err.code || "",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // getIdTokenClaims is stable across renders; `attempt` is the explicit
    // retry trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, error, isLoggedOutRoute, attempt]);

  if (isLoading) {
    return <FullScreenMessage title="Loading…" />;
  }

  if (error) {
    return (
      <FullScreenMessage title="Authentication error">
        <p className="text-red-600">{error.message}</p>
      </FullScreenMessage>
    );
  }

  // Logged-out landing page (shown right after logout; not auto-redirected).
  if (isLoggedOutRoute) {
    return <LoggedOut />;
  }

  // Not authenticated yet → the effect above is redirecting to Auth0.
  if (!isAuthenticated) {
    return <FullScreenMessage title="Redirecting to login…" />;
  }

  if (session.status === "idle" || session.status === "checking") {
    return (
      <FullScreenMessage title="Verifying admin access…">
        Checking whether{" "}
        <span className="font-medium text-gray-700">
          {user?.email || "this account"}
        </span>{" "}
        is on the admin list.
      </FullScreenMessage>
    );
  }

  if (session.status === "denied") {
    return (
      <AccessDenied
        email={user?.email}
        message={session.message}
        onRetry={retryAccessCheck}
        onLogout={handleLogout}
      />
    );
  }

  if (session.status === "error") {
    return (
      <FullScreenMessage title="Could not verify admin access">
        <p>{session.message}</p>
        <div className="mt-4 flex justify-center gap-3">
          <button
            type="button"
            onClick={retryAccessCheck}
            className={secondaryButton}
          >
            Try again
          </button>
          <button type="button" onClick={handleLogout} className={primaryButton}>
            Sign in again
          </button>
        </div>
      </FullScreenMessage>
    );
  }

  return (
    <AdminSessionProvider
      value={{ admin: session.admin, token: session.token }}
    >
      <RouterProvider router={router} />
      <Toast />
    </AdminSessionProvider>
  );
}

export default App;
