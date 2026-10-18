import User from "../Modals/user.modal.js";

// ---------------------------------------------------------------------------
// Account-status enforcement.
//
// Real e-commerce apps gate EVERY authenticated action on the account's status,
// not just the login screen. This middleware is that gate: it runs before any
// business logic on customer routes and rejects blocked accounts with a
// consistent 403 + machine-readable code the storefront can react to.
//
// Because this project authenticates on the client (Clerk) and passes the
// Clerk id to the API as `userId`, we resolve the account from that id. When
// the request carries a `sessionVersion`, we also verify it against the user's
// current version — a mismatch means the account changed (e.g. was blocked)
// after the client loaded, so we force a re-auth.
// ---------------------------------------------------------------------------

// Pick whichever Clerk id the request carries.
const resolveUserId = (req) =>
  req.body?.userId ??
  req.params?.userId ??
  req.query?.userId ??
  null;

// Attach a blocked response the client can detect reliably.
const blockedResponse = (res, reason) =>
  res.status(403).json({
    success: false,
    code: "ACCOUNT_BLOCKED",
    message:
      reason ||
      "Your account has been blocked. Please contact support for assistance.",
  });

// Standard guard: 403 if the account is blocked.
export const requireActiveAccount = async (req, res, next) => {
  try {
    const userId = resolveUserId(req);
    // No id at all → let the route's own validation handle it (e.g. public
    // reads). This middleware's only job is the *blocked* check.
    if (!userId) return next();

    const user = await User.findOne({ clerkId: userId })
      .select("isBlocked blockReason sessionVersion")
      .lean();

    // Account isn't in our DB yet (webhook lag / not registered) — don't block;
    // the route can still function and the webhook will catch up.
    if (!user) return next();

    if (user.isBlocked) {
      return blockedResponse(res, user.blockReason);
    }

    // Optional session-version check: if the client sent one and it no longer
    // matches, the session is stale (account status may have changed).
    const clientVersion =
      req.body?.sessionVersion ?? req.query?.sessionVersion;
    if (
      clientVersion !== undefined &&
      Number(clientVersion) !== Number(user.sessionVersion || 0)
    ) {
      return res.status(401).json({
        success: false,
        code: "SESSION_STALE",
        message: "Your session is out of date. Please refresh.",
      });
    }

    // Expose the resolved account (handy for downstream handlers).
    req.account = user;
    return next();
  } catch (err) {
    console.error("requireActiveAccount error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Could not verify account status" });
  }
};
