import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import logo from "../../assets/styloandcologo.png";

// Landing page shown after the user logs out.
// App.jsx suppresses the auto-redirect to Auth0 on this route so the page is
// actually visible. From here the user can log in again or sign up.
const LoggedOut = () => {
  const { loginWithRedirect } = useAuth0();

  // Admin accounts are created by an existing admin, not through this page,
  // so always land on the Auth0 login screen (never the sign-up screen).
  const login = () =>
    loginWithRedirect({
      appState: { returnTo: "/" },
      authorizationParams: { screen_hint: "login" },
    });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="flex flex-col items-center">
          <img src={logo} alt="styloandco" className="h-14 w-auto" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            styloandco
          </h1>
          <p className="text-sm font-medium text-gray-500">
            Admin Panel · Style That Speaks
          </p>
        </div>

        <p className="mt-6 text-sm text-gray-600">
          You have been logged out. Sign in to continue managing the store.
        </p>

        <div className="mt-8">
          <button
            type="button"
            onClick={login}
            className="w-full rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Log in
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Access is restricted to administrators added by an existing admin.
        </p>
      </div>
    </div>
  );
};

export default LoggedOut;
