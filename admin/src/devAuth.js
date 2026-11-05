// Local-only Auth0 bypass. VITE_DEV_AUTH_BYPASS lives in
// .env.development.local, and import.meta.env.DEV is false in every production
// build, so this can never activate on the deployed admin panel.
export const DEV_AUTH_BYPASS =
  import.meta.env.DEV &&
  String(import.meta.env.VITE_DEV_AUTH_BYPASS).toLowerCase() === "true";

export const devAdminUser = {
  sub: "dev|local-admin",
  name: "Dev Admin",
  nickname: "dev-admin",
  email: "dev-admin@localhost",
  picture: "",
  email_verified: true,
};

// Shape matches what /api/admins/me returns, since the bypass skips the
// server lookup that normally populates the session.
export const devAdminSession = {
  _id: "dev-admin",
  auth0Id: devAdminUser.sub,
  email: devAdminUser.email,
  name: devAdminUser.name,
  picture: "",
  role: "owner",
  isActive: true,
  isLinked: true,
  isSelf: true,
  createdBy: "dev",
  lastLoginAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  permissions: { canManageOwners: true },
};

const unsupported = async () => {
  throw new Error("Auth0 is bypassed in local development.");
};

// Stand-in for the context @auth0/auth0-react normally provides, so the rest of
// the app (useAuth0 in App, Navbar and LoggedOut) keeps working unchanged.
export const devAuthContext = {
  isLoading: false,
  isAuthenticated: true,
  user: devAdminUser,
  error: undefined,
  loginWithRedirect: async () => {
    window.location.assign("/");
  },
  loginWithPopup: unsupported,
  logout: async () => {
    window.location.assign("/logged-out");
  },
  getAccessTokenSilently: unsupported,
  getAccessTokenWithPopup: unsupported,
  getIdTokenClaims: async () => null,
  handleRedirectCallback: unsupported,
};
