import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { NotificationProvider } from "./context/NotificationContext.jsx"; // <-- import your context

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "393347327727-7osvc6kkpsn5ogmvradmmiql1vfpvdhc.apps.googleusercontent.com"}>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
