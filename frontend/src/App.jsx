import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";

export default function App() {
  const { pathname } = useLocation();
  const isApp = pathname.startsWith("/app");
  const isLanding = pathname === "/";

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#0a0a1a_0%,#0d1b2a_100%)] text-slate-100 font-[Inter,sans-serif] selection:bg-[#14b8a5] selection:text-white">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1e293b",
            color: "#e2e8f0",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            fontSize: "14px",
            backdropFilter: "blur(12px)",
          },
          success: {
            iconTheme: { primary: "#14b8a5", secondary: "#0f172a" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#0f172a" },
            duration: 5000,
          },
        }}
      />
      <Navbar />
      {/* Remove top padding for landing page to allow fullbleed hero */}
      <div
        className={isLanding ? "" : isApp ? "pt-[72px] h-screen" : "pt-[72px]"}
      >
        <Outlet />
      </div>
    </div>
  );
}
