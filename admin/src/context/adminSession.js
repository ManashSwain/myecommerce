import { createContext, useContext } from "react";

// Holds the verified admin record + Auth0 ID token for the signed-in session.
// App.jsx only mounts the router (and therefore the provider) after the
// server has confirmed the identity is on the admin allow-list.
export const AdminSessionContext = createContext(null);

export const useAdminSession = () => {
  const value = useContext(AdminSessionContext);
  if (!value) {
    throw new Error("useAdminSession must be used within AdminSessionProvider");
  }
  return value;
};
