import { createRemoteJWKSet, jwtVerify } from "jose";

// ---------------------------------------------------------------------------
// Auth0 ID-token verification.
//
// The admin SPA authenticates with Auth0 and sends its ID token to this API as
// `Authorization: Bearer <id_token>`. We verify the signature against the
// tenant's JWKS and check the issuer + audience before trusting any claim.
//
// Why the ID token rather than an access token? The SPA is configured without
// a custom API audience, so `getAccessTokenSilently()` yields a token for the
// /userinfo endpoint that does not carry the user's email. The ID token is
// signed by Auth0, has the same `sub`, and includes `email` / `email_verified`,
// which is what the allow-list needs. If you later add an Auth0 API audience,
// switch this to access-token verification and read the email from a custom
// claim.
//
// Env is read lazily inside the function because ES module imports are
// evaluated before `dotenv.config()` runs in index.js.
// ---------------------------------------------------------------------------

const normalizeDomain = (value) =>
  String(value || "")
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

let jwks = null;
let jwksDomain = null;

export const getAuth0Config = () => ({
  domain: normalizeDomain(process.env.AUTH0_DOMAIN),
  clientId: String(process.env.AUTH0_CLIENT_ID || "").trim(),
});

export const verifyAuth0IdToken = async (token) => {
  const { domain, clientId } = getAuth0Config();

  if (!domain || !clientId) {
    throw new Error(
      "AUTH0_DOMAIN and AUTH0_CLIENT_ID must be set on the server",
    );
  }

  // Rebuild the key set if the domain changes (e.g. after editing .env).
  if (!jwks || jwksDomain !== domain) {
    jwks = createRemoteJWKSet(
      new URL(`https://${domain}/.well-known/jwks.json`),
    );
    jwksDomain = domain;
  }

  const { payload } = await jwtVerify(token, jwks, {
    issuer: `https://${domain}/`,
    audience: clientId,
    // Auth0 signs ID tokens with RS256.
    algorithms: ["RS256"],
  });

  return payload;
};
