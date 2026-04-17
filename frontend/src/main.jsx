import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { NotificationProvider } from "./context/NotificationContext.jsx"; // <-- import your context

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="393347327727-r426598q1u50ffdjg9r6hoiq8n0mcik0.apps.googleusercontent.com">
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
