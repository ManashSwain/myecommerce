import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App.jsx";
import { ClerkProvider } from "@clerk/react";

createRoot(document.getElementById("root")).render(
  <ClerkProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ClerkProvider>,
);
