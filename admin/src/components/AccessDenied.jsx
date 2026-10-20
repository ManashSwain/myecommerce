import { ShieldX, LogOut, RefreshCw } from "lucide-react";
import logo from "../../assets/styloandcologo.png";

// Shown when Auth0 authenticates the person but they are not on the admin
// allow-list (or their access was disabled). The app never mounts the router
// in this state, so no panel data is rendered.
const AccessDenied = ({ email, message, onRetry, onLogout }) => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <div className="flex flex-col items-center">
        <img src={logo} alt="styloandco" className="h-14 w-auto" />
        <span className="mt-6 flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <ShieldX size={24} />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Access denied
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {message ||
            "This account doesn't have access to the admin panel."}
        </p>
        {email && (
          <p className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500">
            Signed in as <span className="font-medium">{email}</span>
          </p>
        )}
        <p className="mt-3 text-xs text-gray-400">
          Admin access is granted by an existing administrator. If you think
          this is a mistake, ask them to add this email.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <RefreshCw size={16} />
          Check again
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  </div>
);

export default AccessDenied;
