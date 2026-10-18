import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { NoSymbolIcon } from "@heroicons/react/24/outline";
import { SignOutButton } from "@clerk/react";
import { Link } from "react-router";

// ---------------------------------------------------------------------------
// Shown whenever the account is blocked — either on load (status check) or when
// a storefront action is refused (adding to cart, checkout, buying, etc.).


// The user can dismiss it to keep browsing, go to support, or sign out. It is
// re-shown whenever another blocked action is attempted.
// ---------------------------------------------------------------------------

const AccountBlockedModal = ({ open, reason, onClose, onContact }) => {
  return (
    <Dialog open={open} onClose={() => {}} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-900/60 transition-opacity duration-300 data-closed:opacity-0"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel
          transition
          className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl transition data-closed:scale-95 data-closed:opacity-0"
        >
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-red-50">
            <NoSymbolIcon className="size-9 text-red-600" />
          </div>

          <DialogTitle className="mt-5 text-xl font-bold text-gray-900">
            Your account is blocked
          </DialogTitle>

          <p className="mt-3 text-sm text-gray-600">
            You can't add items to your cart, place orders, or use other
            account features right now.
          </p>

          {reason && (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              <span className="font-medium">Reason:</span> {reason}
            </p>
          )}

          <p className="mt-4 text-sm text-gray-600">
            If you believe this is a mistake, please contact our support team
            to resolve it.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/contact"
              onClick={onContact}
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Contact support
            </Link>
            <SignOutButton>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Sign out
              </button>
            </SignOutButton>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="mt-4 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Dismiss
            </button>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default AccountBlockedModal;
