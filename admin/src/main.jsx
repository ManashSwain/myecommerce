import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Auth0Provider, Auth0Context } from "@auth0/auth0-react";
import { DEV_AUTH_BYPASS, devAuthContext } from './devAuth.js'

const authdomain = import.meta.env.VITE_AUTH0_DOMAIN
const authclientid = import.meta.env.VITE_AUTH0_CLIENTID

const app = DEV_AUTH_BYPASS ? (
  <Auth0Context.Provider value={devAuthContext}>
    <App />
  </Auth0Context.Provider>
) : (
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
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {app}
  </StrictMode>,
)
