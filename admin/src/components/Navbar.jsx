import React, { useState, useRef, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { LogOut, ChevronDown, UserRound } from "lucide-react";
import logo from "../../assets/styloandcologo.png";

// Top navigation bar for the admin panel.
// Shows the brand on the left and the signed-in user's profile (loaded from
// Auth0) on the right, with a dropdown containing logout.
const Navbar = () => {
  const { user, logout } = useAuth0();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the dropdown when clicking outside of it.
  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleLogout = () =>
    logout({
      logoutParams: {
        returnTo: `${window.location.origin}/logged-out`,
      },
    });
  // Prefer the account name, fall back to the email local-part.
  const displayName =
    user?.name || user?.nickname || user?.email?.split("@")[0] || "Admin";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="fixed top-0 inset-x-0 z-30 h-16 border-b border-gray-200 bg-white">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <a href="/" className="flex items-center gap-2">
          <img src={logo} className="h-9 w-auto" alt="styloandco" />
          <span className="flex flex-col leading-none">
            <span className="text-lg font-bold text-blue-600">styloandco</span>
            <span className="text-xs font-medium text-gray-500">
                Style That Speaks
              </span>
            </span>
          </a>

        {/* Profile + logout */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-gray-200 py-1 pl-1 pr-3 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            {user?.picture ? (
              <img
                src={user.picture}
                alt={displayName}
                className="size-8 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex size-8 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
                {initial}
              </span>
            )}
            <span className="hidden max-w-40 truncate text-sm font-medium text-gray-700 sm:block">
              {displayName}
            </span>
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>

          {open && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-64 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
            >
              {/* Profile details */}
              <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={displayName}
                    className="size-10 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <UserRound size={20} />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {displayName}
                  </p>
                  {user?.email && (
                    <p className="truncate text-xs text-gray-500">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Logout */}
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} />
                Log out
              </button>
            </div>
          )}
          </div>
        </div>
    </header>
  );
};

export default Navbar;

