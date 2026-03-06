import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div
      id="top"
      className="bg-[#f6f8f8] dark:bg-[#0f172a] font-['Inter'] text-slate-100 dark:text-slate-100 antialiased overflow-x-hidden min-h-screen"
    >
      <style>{`
.glass {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .glow-teal {
            box-shadow: 0 0 40px -10px rgba(20, 184, 165, 0.3);
        }
        .bg-gradient-mesh {
            background-color: #0f172a;
            background-image: 
                radial-gradient(at 0% 0%, rgba(20, 184, 165, 0.15) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.15) 0px, transparent 50%);
        }
      `}</style>

      <div className="bg-gradient-mesh">
        {/* Hero Section */}
        <main className="relative px-10 py-20 lg:py-32 flex flex-col items-center text-center">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#14b8a5]/20 blur-[120px] rounded-full -z-10"></div>
          <span className="inline-block px-4 py-1.5 rounded-full glass text-xs font-bold tracking-widest uppercase text-[#14b8a5] mb-6 border-[#14b8a5]/20">
            Powered by Advanced Neural Networks
          </span>
          <h1 className="text-5xl lg:text-7xl font-black leading-tight tracking-tight mb-8">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#14b8a5] via-[#14b8a5] to-[#a855f7]">
              Bridge the Communication Gap
            </span>
          </h1>
          <p className="max-w-2xl text-lg lg:text-xl text-slate-400 font-medium mb-12 leading-relaxed">
            Real-time Indian Sign Language translation powered by advanced AI.
            Break barriers instantly with ISL to speech and text conversion
            designed for everyone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/session"
              className="min-w-[200px] bg-[#14b8a5] text-[#0f172a] h-14 rounded-xl text-base font-bold glow-teal hover:scale-105 transition-transform flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">rocket_launch</span>
              Launch App
            </Link>
            <a
              href="https://github.com/shaurya-jain23/SignBridge#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-[200px] glass text-white h-14 rounded-xl text-base font-bold hover:bg-white/5 transition-colors border-white/10 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">menu_book</span>
              View Documentation
            </a>
          </div>
          {/* Dashboard Preview */}
          <div className="mt-24 w-full max-w-5xl glass rounded-2xl p-4 shadow-2xl border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#14b8a5]/10 to-[#a855f7]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <img
              className="w-full h-[400px] object-cover rounded-xl grayscale-[0.2] opacity-80"
              data-alt="Abstract visualization of AI data processing for sign language"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPvyq6eCnE-vT4bWtyEXxEMX3SEyUTHkzJ0hPCp0GVYdYlxesaMD6Lar8iGkEK-MswOLfyOa5-UUly_Y6X8Wtk8KhrB-3tTDpMSkeBx117r7eqVGqnG4JLSrf9pgBOUwdqZB2w67q2lcC0b-qkgrY5LISfrUb9UrVAmrlGaFhYv3vsQfT1iO-y4spc8AWDGZucy574n_xEma7ZhhYyU8tLLq_whkieOohRX3RMgwkVWsmkpPHEzDwaeA2hR8MkO92bjuBBuqTqHA"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Link
                to="/session"
                className="w-20 h-20 bg-[#14b8a5] rounded-full flex items-center justify-center glow-teal hover:scale-110 transition-transform"
              >
                <span className="material-symbols-outlined text-[#0f172a] text-4xl fill-1">
                  play_arrow
                </span>
              </Link>
            </div>
          </div>
        </main>
        {/* Features Section */}
        <section id="features" className="px-10 py-24 bg-[#0f172a]/50">
          <div className="max-w-6xl mx-auto">
            <div className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Powerful Features for <br />
                <span className="text-[#14b8a5]">Seamless Interaction</span>
              </h2>
              <p className="text-slate-400 max-w-xl">
                Designed for accuracy, speed, and accessibility across all
                platforms, from mobile to enterprise kiosks.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="glass p-8 rounded-2xl border-white/5 group hover:border-[#14b8a5]/30 transition-all">
                <div className="w-14 h-14 rounded-xl bg-[#14b8a5]/10 flex items-center justify-center text-[#14b8a5] mb-6 group-hover:bg-[#14b8a5] group-hover:text-[#0f172a] transition-colors">
                  <span className="material-symbols-outlined text-3xl">
                    video_camera_front
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-3">Tri-Mode Recognition</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Comprehensive support for live video feeds, real-time camera
                  streams, and static image analysis using our proprietary
                  ISL-Net.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="glass p-8 rounded-2xl border-white/5 group hover:border-[#a855f7]/30 transition-all">
                <div className="w-14 h-14 rounded-xl bg-[#a855f7]/10 flex items-center justify-center text-[#a855f7] mb-6 group-hover:bg-[#a855f7] group-hover:text-[#0f172a] transition-colors">
                  <span className="material-symbols-outlined text-3xl">
                    translate
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-3">
                  Multilingual Translation
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Instantly convert ISL into English, Hindi, and 12+ regional
                  Indian languages with natural language processing nuance.
                </p>
              </div>
              {/* Feature 3 */}
              <div className="glass p-8 rounded-2xl border-white/5 group hover:border-[#14b8a5]/30 transition-all">
                <div className="w-14 h-14 rounded-xl bg-[#14b8a5]/10 flex items-center justify-center text-[#14b8a5] mb-6 group-hover:bg-[#14b8a5] group-hover:text-[#0f172a] transition-colors">
                  <span className="material-symbols-outlined text-3xl">
                    history_edu
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-3">Phrase History</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Intelligently save and organize frequently used signs and
                  translated contexts for quick offline access and learning.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* How It Works Section */}
        <section id="how-it-works" className="px-10 py-32">
          <div className="max-w-6xl mx-auto text-center mb-20">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Three Steps to Connection
            </h2>
            <p className="text-slate-400">
              Our advanced pipeline handles the complexity, you focus on the
              conversation.
            </p>
          </div>
          <div className="relative max-w-5xl mx-auto">
            {/* Connector Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#14b8a5]/30 to-transparent -translate-y-1/2 -z-10"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 relative">
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full glass border-[#14b8a5]/40 flex items-center justify-center mb-8 relative">
                  <div className="absolute inset-0 rounded-full bg-[#14b8a5]/20 animate-pulse"></div>
                  <span className="material-symbols-outlined text-[#14b8a5] text-4xl">
                    photo_camera
                  </span>
                  <div className="absolute -top-2 -right-2 bg-[#14b8a5] text-[#0f172a] text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
                    1
                  </div>
                </div>
                <h4 className="text-xl font-bold mb-2">Camera Input</h4>
                <p className="text-slate-400 text-sm max-w-[200px]">
                  Position yourself clearly and start signing in natural light.
                </p>
              </div>
              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full glass border-[#a855f7]/40 flex items-center justify-center mb-8 relative">
                  <div className="absolute inset-0 rounded-full bg-[#a855f7]/10"></div>
                  <span className="material-symbols-outlined text-[#a855f7] text-4xl">
                    psychology
                  </span>
                  <div className="absolute -top-2 -right-2 bg-[#a855f7] text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
                    2
                  </div>
                </div>
                <h4 className="text-xl font-bold mb-2">AI Processing</h4>
                <p className="text-slate-400 text-sm max-w-[200px]">
                  Our neural networks analyze 21+ hand landmarks and facial
                  cues.
                </p>
              </div>
              {/* Step 3 */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full glass border-[#14b8a5]/40 flex items-center justify-center mb-8 relative">
                  <div className="absolute inset-0 rounded-full bg-[#14b8a5]/10"></div>
                  <span className="material-symbols-outlined text-[#14b8a5] text-4xl">
                    record_voice_over
                  </span>
                  <div className="absolute -top-2 -right-2 bg-[#14b8a5] text-[#0f172a] text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
                    3
                  </div>
                </div>
                <h4 className="text-xl font-bold mb-2">
                  Translation &amp; Audio
                </h4>
                <p className="text-slate-400 text-sm max-w-[200px]">
                  Instant text-to-speech output in your preferred language.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* CTA Section */}
        <section className="px-10 py-32 relative text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-[#14b8a5]/20 to-[#a855f7]/20 blur-[120px] rounded-full -z-10"></div>
          <h2 className="text-4xl lg:text-5xl font-black mb-6">
            Ready to Break the Barrier?
          </h2>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            Join thousands of users communicating seamlessly across languages
            and abilities.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/session"
              className="min-w-[200px] bg-white text-[#0f172a] h-14 rounded-xl text-base font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">rocket_launch</span>
              Get Started for Free
            </Link>
            <a
              href="https://github.com/shaurya-jain23/SignBridge#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-[200px] glass text-white h-14 rounded-xl text-base font-bold hover:bg-white/5 transition-colors border-white/10 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">menu_book</span>
              View Documentation
            </a>
          </div>
        </section>
        <section id="docs" className="px-10 py-16">
          <div className="max-w-6xl mx-auto glass rounded-2xl p-8 lg:p-10 border-white/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Documentation
              </h3>
              <p className="text-slate-400 text-sm lg:text-base">
                Explore setup guides, architecture, and training instructions
                for the SignBridge pipeline.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://github.com/shaurya-jain23/SignBridge#readme"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#14b8a5] text-[#0f172a] px-5 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition-all"
              >
                Open README
              </a>
              <a
                href="/api/health"
                target="_blank"
                rel="noopener noreferrer"
                className="glass px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-200 hover:bg-white/5 transition-all"
              >
                API Health
              </a>
            </div>
          </div>
        </section>
        {/* Footer */}
        <footer className="px-10 py-16 border-t border-white/5 mt-10">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="max-w-xs">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-[#14b8a5]/20 p-1.5 rounded-lg border border-[#14b8a5]/30">
                  <span className="material-symbols-outlined text-[#14b8a5] text-sm font-bold">
                    interpreter_mode
                  </span>
                </div>
                <h2 className="text-lg font-bold tracking-tight text-white">
                  SignBridge Pro
                </h2>
              </div>
              <p className="text-slate-500 text-sm mb-6">
                Leading the way in accessible communication through innovative
                AI solutions for the deaf and hard of hearing community.
              </p>
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full w-fit">
                <span className="material-symbols-outlined text-xs text-[#14b8a5] fill-1">
                  verified
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Built for Accessibility
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-16">
              <div className="flex flex-col gap-4">
                <h4 className="font-bold text-white text-sm uppercase tracking-widest">
                  Platform
                </h4>
                <a
                  className="text-slate-400 hover:text-[#14b8a5] text-sm transition-colors"
                  href="#"
                >
                  Web App
                </a>
                <a
                  className="text-slate-400 hover:text-[#14b8a5] text-sm transition-colors"
                  href="#"
                >
                  Mobile App
                </a>
                <a
                  className="text-slate-400 hover:text-[#14b8a5] text-sm transition-colors"
                  href="#"
                >
                  API Access
                </a>
              </div>
              <div className="flex flex-col gap-4">
                <h4 className="font-bold text-white text-sm uppercase tracking-widest">
                  Resources
                </h4>
                <a
                  className="text-slate-400 hover:text-[#14b8a5] text-sm transition-colors"
                  href="#"
                >
                  Documentation
                </a>
                <a
                  className="text-slate-400 hover:text-[#14b8a5] text-sm transition-colors"
                  href="#"
                >
                  Research Paper
                </a>
                <a
                  className="text-slate-400 hover:text-[#14b8a5] text-sm transition-colors"
                  href="#"
                >
                  ISL Guide
                </a>
              </div>
              <div className="flex flex-col gap-4">
                <h4 className="font-bold text-white text-sm uppercase tracking-widest">
                  Company
                </h4>
                <a
                  className="text-slate-400 hover:text-[#14b8a5] text-sm transition-colors"
                  href="#"
                >
                  About Us
                </a>
                <a
                  className="text-slate-400 hover:text-[#14b8a5] text-sm transition-colors"
                  href="#"
                >
                  Contact
                </a>
                <a
                  className="text-slate-400 hover:text-[#14b8a5] text-sm transition-colors"
                  href="#"
                >
                  Support
                </a>
              </div>
            </div>
          </div>
          <div className="max-w-6xl mx-auto pt-16 mt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-500 text-xs">
              © 2024 SignBridge Pro. All rights reserved.
            </p>
            <div className="flex items-center gap-8 text-xs text-slate-500">
              <a className="hover:text-[#14b8a5] transition-colors" href="#">
                Privacy Policy
              </a>
              <a className="hover:text-[#14b8a5] transition-colors" href="#">
                Terms of Service
              </a>
              <a className="hover:text-[#14b8a5] transition-colors" href="#">
                Cookies
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
