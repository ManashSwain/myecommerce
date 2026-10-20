import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Auth0Provider } from "@auth0/auth0-react";

const authdomain = import.meta.env.VITE_AUTH0_DOMAIN
const authclientid = import.meta.env.VITE_AUTH0_CLIENTID

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Auth0Provider
      domain={authdomain}
      clientId={authclientid}
      authorizationParams={{
        redirect_uri: window.location.origin,
        // Email is needed by the server-side admin allow-list check.
        scope: "openid profile email",
      }}
    >
    <App />
    </Auth0Provider>
  </StrictMode>,
)
