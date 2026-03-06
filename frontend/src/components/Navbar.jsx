import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();
  const isLanding = pathname === "/";

  const scrollToSection = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      // Update URL without jump
      window.history.pushState(null, "", `#${id}`);
    } else {
      // If we are not on landing page, navigate to home + hash
      window.location.href = `/#${id}`;
    }
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 border-b border-white/5 ${
        isLanding
          ? "bg-[#0f172a]/35 backdrop-blur-md"
          : "bg-[#0f172a]/90 backdrop-blur-md"
      }`}
    >
      <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 lg:px-10 py-4">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-[#14b8a5] p-2 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 shadow-[0_0_20px_-5px_rgba(20,184,165,0.3)]">
            <span className="material-symbols-outlined text-[#0f172a] font-bold">
              interpreter_mode
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#14b8a5] to-[#a855f7]">
            SignBridge Pro
          </h2>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-10">
          {isLanding ? (
            <>
              <a
                href="#top"
                onClick={(e) => scrollToSection(e, "top")}
                className="text-sm font-medium text-slate-300 hover:text-[#14b8a5] transition-colors tracking-wide"
              >
                Home
              </a>
              <a
                href="#features"
                onClick={(e) => scrollToSection(e, "features")}
                className="text-sm font-medium text-slate-300 hover:text-[#14b8a5] transition-colors tracking-wide"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => scrollToSection(e, "how-it-works")}
                className="text-sm font-medium text-slate-300 hover:text-[#14b8a5] transition-colors tracking-wide"
              >
                How it Works
              </a>
              <a
                href="#docs"
                onClick={(e) => scrollToSection(e, "docs")}
                className="text-sm font-medium text-slate-300 hover:text-[#14b8a5] transition-colors tracking-wide"
              >
                Documentation
              </a>
            </>
          ) : (
            <>
              <Link
                to="/"
                className="text-sm font-medium text-slate-300 hover:text-[#14b8a5] transition-colors tracking-wide"
              >
                Home
              </Link>
              <Link
                to="/session"
                className="text-sm font-bold text-[#14b8a5] tracking-wide"
              >
                Join Session
              </Link>
            </>
          )}
        </nav>

        {/* CTA Section */}
        <div className="flex items-center gap-4">
          {isLanding && (
            <button className="hidden sm:block text-sm font-semibold text-slate-300 hover:text-[#14b8a5] px-4 py-2 transition-colors">
              Login
            </button>
          )}
          <Link
            to="/session"
            className="bg-[#14b8a5] text-[#0f172a] px-5 py-2.5 rounded-lg text-sm font-bold shadow-[0_0_30px_-5px_rgba(20,184,165,0.4)] hover:shadow-[0_0_40px_-5px_rgba(20,184,165,0.6)] hover:scale-105 transition-all"
          >
            {isLanding ? "Get Started" : "Join Session"}
          </Link>
        </div>
      </div>
    </header>
  );
}
