import { getAuth } from "@clerk/express";

// Reject requests without a real Clerk session and expose the verified user id
// to the route. Never trust a clerkId sent in the request body.
export const requireClerkUser =
  (message = "Please sign in to continue.") =>
  (req, res, next) => {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        code: "SIGN_IN_REQUIRED",
        message,
      });
    }

    req.clerkUserId = userId;
    next();
  };
