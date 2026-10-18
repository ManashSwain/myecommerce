import { useEffect, useState } from "react";
import useAuth from "../customhooks/useAuth";
import {
  ACCOUNT_BLOCKED_EVENT,
  trackLogin,
  fetchMyStatus,
} from "../utils/api";
import AccountBlockedModal from "./AccountBlockedModal";

// ---------------------------------------------------------------------------
// Sits (once) at the root of the storefront and keeps the blocked state in
// sync with the server:
//   1. On sign-in, records the login and checks the account status.
//   2. Listens for ACCOUNT_BLOCKED_EVENT fired by apiFetch when any action is
//      refused because the account is blocked.
//   3. Renders the blocking modal when needed.
// ---------------------------------------------------------------------------
const AccountStatusProvider = ({ children }) => {
  const { isSignedIn, user, isLoaded } = useAuth();
  // `isBlocked` = real account state. `modalOpen` = whether the modal is shown.
  // They're separate so the user can dismiss the modal / go to support while
  // still being blocked; the next blocked action re-opens it.
  const [isBlocked, setIsBlocked] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState("");

  // Show the modal (used when we first detect a block or an action is refused).
  const showModal = (reasonText) => {
    setReason(reasonText || "");
    setModalOpen(true);
  };

  // On sign-in: record login + read current status.
  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (!isLoaded || !isSignedIn || !user?.id) {
        // Signed out → clear any blocked state.
        setIsBlocked(false);
        setModalOpen(false);
        setReason("");
        return;
      }
      try {
        const status = await trackLogin(user.id);
        if (cancelled) return;
        if (status?.isBlocked) {
          setIsBlocked(true);
          showModal(status.blockReason);
        } else {
          // Also confirms status in case track-login didn't (e.g. webhook lag).
          const s = await fetchMyStatus(user.id);
          if (cancelled) return;
          setIsBlocked(!!s?.isBlocked);
          if (s?.isBlocked) showModal(s.blockReason);
        }
      } catch {
        // Network hiccup — don't block the UI on a failed status check.
      }
    };

    check();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, user?.id]);

  // Any refused action broadcasts this event → re-open the modal.
  useEffect(() => {
    const onBlocked = (e) => {
      setIsBlocked(true);
      showModal(e?.detail?.reason);
    };
    window.addEventListener(ACCOUNT_BLOCKED_EVENT, onBlocked);
    return () => window.removeEventListener(ACCOUNT_BLOCKED_EVENT, onBlocked);
  }, []);

  return (
    <>
      {children}
      <AccountBlockedModal
        open={modalOpen}
        reason={reason}
        onClose={() => setModalOpen(false)}
        onContact={() => setModalOpen(false)}
      />
    </>
  );
};

export default AccountStatusProvider;
