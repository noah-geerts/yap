import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Auth0Provider } from "@auth0/auth0-react";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Auth0Provider
      domain="dev-h60bzgedqbu866oj.us.auth0.com"
      clientId="oChL1cF7z2s0HAHpVVEylH9C0laOfXkf"
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: "http://localhost:3000",
      }}
    >
      <App />
    </Auth0Provider>
  </StrictMode>
);
