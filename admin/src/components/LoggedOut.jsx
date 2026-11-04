import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import {
  LayoutDashboard,
  LogIn,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import logo from "../../assets/styloandcologo.png";

const highlights = [
  {
    icon: ShieldCheck,
    text: "Auth0-protected, allow-list-only admin access.",
  },
  {
    icon: LayoutDashboard,
    text: "Orders, products, customers, and support in one workspace.",
  },
  {
    icon: Sparkles,
    text: "Store analytics and AI assistant controls.",
  },
];

// Landing page shown after the user logs out.
// App.jsx suppresses the auto-redirect to Auth0 on this route so the page is
// actually visible. From here the user can log in again.
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
    <div className="grid min-h-screen bg-gray-50 lg:grid-cols-2">
      {/* Brand panel (desktop only) */}
      <aside className="relative hidden overflow-hidden bg-slate-950 px-12 py-14 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="absolute -top-28 -right-28 size-80 rounded-full bg-blue-600/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-28 -left-28 size-80 rounded-full bg-indigo-500/10 blur-3xl"
        />

        <div className="relative">
          <div className="inline-flex items-center rounded-xl bg-white p-3 shadow-lg">
            <img src={logo} alt="styloandco" className="h-10 w-auto" />
          </div>

          <h1 className="mt-12 max-w-sm text-4xl font-bold tracking-tight text-white">
            Style that speaks. Operations that scale.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
            The styloandco admin workspace keeps the store running — from
            products and orders to customers and support.
          </p>

          <ul className="mt-10 space-y-4">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.text}
                  className="flex items-start gap-3 text-sm text-slate-300"
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-blue-300">
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <span className="leading-6">{item.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">
          © {new Date().getFullYear()} styloandco
        </p>
      </aside>

      {/* Sign-in panel */}
      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <img src={logo} alt="styloandco" className="h-12 w-auto" />
            <p className="mt-2 text-sm font-medium text-gray-500">
              Admin Panel · Style That Speaks
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="h-1.5 bg-blue-600" />
            <div className="p-8 text-center sm:p-10">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-8 ring-blue-50/60">
                <LogIn size={26} aria-hidden="true" />
              </span>

              <h2 className="mt-6 text-2xl font-bold text-gray-900">
                You&apos;ve been signed out
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Your admin session has ended. Sign in again to continue
                managing the store.
              </p>

              <button
                type="button"
                onClick={login}
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <LogIn size={18} aria-hidden="true" />
                Sign in again
              </button>

              <div className="mt-6 flex items-start gap-3 rounded-lg bg-gray-50 px-4 py-3 text-left">
                <ShieldCheck
                  size={18}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-gray-400"
                />
                <p className="text-xs leading-5 text-gray-500">
                  Access is restricted to administrators approved by an
                  existing admin. If you need access, ask an administrator to
                  add your email.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            styloandco Admin Panel · Secure access
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoggedOut;
