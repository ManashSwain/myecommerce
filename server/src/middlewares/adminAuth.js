import Admin from "../Modals/admin.modal.js";
import { verifyAuth0IdToken } from "../utils/auth0.js";

// ---------------------------------------------------------------------------
// Admin authorization gate.
//
// Every /api/admins request must carry a valid Auth0 ID token. Authentication
// alone is not enough: the identity must also exist in the Admin collection
// (and be active). This is the server-side half of "only configured admins can
// use the panel" — hiding the UI is not a security boundary.
//
// First sign-in paths:
//   1. If an admin record with this Auth0 `sub` exists → use it.
//   2. Else if a record with this email was pre-created by an owner → link it.
//   3. Else if the email is listed in SUPER_ADMIN_EMAILS → create the owner.
//   4. Otherwise deny with NOT_AN_ADMIN.
// ---------------------------------------------------------------------------

const configuredOwnerEmails = () =>
  String(process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

// Email ownership matters when an allow-list entry is matched by email.
// Require Auth0 to report `email_verified: true`; set
// AUTH0_REQUIRE_VERIFIED_EMAIL=false only for local dev if your tenant does
// not verify database-connection emails.
const requiresVerifiedEmail = () =>
  String(process.env.AUTH0_REQUIRE_VERIFIED_EMAIL || "true").toLowerCase() !==
  "false";

const fail = (res, status, code, message) =>
  res.status(status).json({ success: false, code, message });

export const requireAdmin = async (req, res, next) => {
  try {
    const [scheme, token] = String(req.headers.authorization || "").split(" ");
    if (scheme !== "Bearer" || !token) {
      return fail(res, 401, "NO_TOKEN", "Sign in to continue.");
    }

    let payload;
    try {
      payload = await verifyAuth0IdToken(token);
    } catch (err) {
      console.error("Auth0 token verification failed:", err.message);
      return fail(
        res,
        401,
        "INVALID_TOKEN",
        "Your session is invalid or has expired. Please sign in again.",
      );
    }

    const auth0Id = String(payload.sub || "");
    const email = String(payload.email || "")
      .trim()
      .toLowerCase();

    if (!auth0Id) {
      return fail(res, 401, "INVALID_TOKEN", "Your session is missing a subject.");
    }

    // 1) Already linked to this Auth0 identity.
    let admin = await Admin.findOne({ auth0Id });

    // 2) Pre-created by an owner but not linked yet.
    if (!admin && email) {
      const invited = await Admin.findOne({ email });

      if (invited) {
        // Never let a second Auth0 identity claim an email that is already
        // linked to a different account.
        if (invited.auth0Id && invited.auth0Id !== auth0Id) {
          return fail(
            res,
            403,
            "EMAIL_ALREADY_LINKED",
            "This email is already linked to a different sign-in account.",
          );
        }

        if (requiresVerifiedEmail() && payload.email_verified !== true) {
          return fail(
            res,
            403,
            "EMAIL_NOT_VERIFIED",
            "Verify your email address with Auth0, then try again.",
          );
        }

        invited.auth0Id = auth0Id;
        invited.name = invited.name || payload.name || "";
        invited.picture = invited.picture || payload.picture || "";
        await invited.save();
        admin = invited;
      }
    }

    // 3) Bootstrap the owner configured in the server environment.
    if (!admin && email && configuredOwnerEmails().includes(email)) {
      if (requiresVerifiedEmail() && payload.email_verified !== true) {
        return fail(
          res,
          403,
          "EMAIL_NOT_VERIFIED",
          "Verify your email address with Auth0, then try again.",
        );
      }

      admin = await Admin.create({
        auth0Id,
        email,
        name: payload.name || email.split("@")[0],
        picture: payload.picture || "",
        role: "owner",
        createdBy: "system",
      });
    }

    // 4) Not on the allow-list.
    if (!admin) {
      return fail(
        res,
        403,
        "NOT_AN_ADMIN",
        "This account does not have admin access. Ask an existing admin to add your email.",
      );
    }

    if (!admin.isActive) {
      return fail(
        res,
        403,
        "ADMIN_DISABLED",
        "Your admin access has been disabled.",
      );
    }

    // Keep the cached profile fresh; refresh token claims may have changed.
    admin.name = admin.name || payload.name || "";
    admin.picture = payload.picture || admin.picture || "";
    admin.lastLoginAt = new Date();
    await admin.save();

    req.admin = admin;
    req.auth0 = payload;
    return next();
  } catch (err) {
    console.error("requireAdmin error:", err);

    // Unique-index race: two tabs hit first sign-in at the same time.
    if (err?.code === 11000) {
      return fail(
        res,
        409,
        "ADMIN_EXISTS",
        "Your admin account was just created. Please try again.",
      );
    }

    return fail(
      res,
      500,
      "AUTH_CHECK_FAILED",
      "Could not verify admin access.",
    );
  }
};
