import React from "react";
import { 
  Bug, 
  Terminal, 
  ShieldCheck, 
  ArrowRight, 
  Layers, 
  Sparkles, 
  Cpu, 
  Code2, 
  Activity,
  CheckCircle2,
  Lock
} from "lucide-react";

interface LandingViewProps {
  onSignIn: () => void;
  isLoading: boolean;
  authError: string | null;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onSignIn,
  isLoading,
  authError,
}) => {
  return (
    <div id="landing-view-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Subtle background tech grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Header Bar */}
      <header id="landing-nav" className="relative z-10 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                DevLog <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">v2.4</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              id="landing-header-login-btn"
              onClick={onSignIn}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sign In with Google</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto px-6 py-16 flex flex-col justify-center items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 text-xs font-mono mb-8">
          <Bug className="w-3.5 h-3.5" />
          <span>Engineered exclusively for developers &amp; systems debugging</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.15]">
          A structured debugging journal.
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-sky-400 mt-2">
            Not a mood tracker.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
          Rubber-duck your bugs with Gemini. When you close the session, an automated extraction engine parses your root cause, resolution, tags, and failure patterns directly into an isolated Firestore archive.
        </p>

        {authError && (
          <div className="mt-6 p-4 rounded-lg bg-red-950/60 border border-red-800/80 text-red-200 text-xs font-mono max-w-md text-left flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
            <div>
              <p className="font-semibold text-red-100">Authentication Error</p>
              <p className="mt-0.5 text-red-300">{authError}</p>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <button
            id="hero-signin-button"
            onClick={onSignIn}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition shadow-[0_0_25px_rgba(34,211,238,0.25)] hover:shadow-[0_0_35px_rgba(34,211,238,0.35)] cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                Connecting securely...
              </span>
            ) : (
              <>
                <span>Sign In with Google</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* 3 Core Architectural Pillars */}
        <div className="mt-20 w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400 mb-4">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white font-mono">1. Interactive Rubber-Ducking</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Describe race conditions, stack traces, or architecture deadlocks. Gemini guides you through targeted diagnostic questioning.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-teal-400 mb-4">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white font-mono">2. Structured Schema Extraction</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Upon session end, a secondary model call enforces JSON Schema parsing: extracting title, rootCause, resolution, tags, and difficulty.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-sky-400 mb-4">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white font-mono">3. Pattern Radar &amp; Isolation</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Aggregates frequent failure tags across your personal logs in Firestore. Discover recurrent blind spots over time with owner-bound isolation.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 py-6 px-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Authenticated via Firebase &bull; Protected with Owner-Bound Firestore Rules</span>
          </div>
          <div>
            <span>Powered by Google Gemini Fallback Ladder &amp; Cloud Firestore</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
