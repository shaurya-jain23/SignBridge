import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import AppPage from "./pages/AppPage.jsx";
import SessionLobby from "./pages/SessionLobby.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/session" element={<SessionLobby />} />
          <Route path="/app/:roomId/:role" element={<AppPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
