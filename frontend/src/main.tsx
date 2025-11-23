import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "antd/dist/reset.css";
import "./index.css";
import App from "./App";
import { Auth0Provider } from "@auth0/auth0-react";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        // Specify the permissions (scope) that the user needs so they can consent to them when logging in
        // All of these scopes (or a subset of them) can then be later used when requesting JWT's with getAccessTokenSilently
        scope:
          "read:current_user update:current_user_identities update:current_user_metadata",
        audience: "https://dev-h60bzgedqbu866oj.us.auth0.com/api/v2/",
      }}
    >
      <App />
    </Auth0Provider>
  </StrictMode>
);
