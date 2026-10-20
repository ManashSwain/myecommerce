import { AdminSessionContext } from "./adminSession";

export const AdminSessionProvider = ({ value, children }) => (
  <AdminSessionContext.Provider value={value}>
    {children}
  </AdminSessionContext.Provider>
);
