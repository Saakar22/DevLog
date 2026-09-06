import React from "react";
import { 
  Terminal, 
  ShieldCheck, 
  ArrowRight, 
  Code2, 
  Activity,
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
    <div id="landing-view-container" className="min-h-screen text-[#E8E8EA] flex flex-col justify-between selection:bg-[#6EA8FE]/20 selection:text-[#E8E8EA]">
      {/* Top Header */}
      <header id="landing-nav" className="glass-panel sticky top-0 z-30 px-6 py-3.5 border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg glass-panel-secondary flex items-center justify-center text-[#E8E8EA]">
              <Terminal className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono-code text-base font-semibold tracking-tight text-[#E8E8EA]">
                DevLog
              </span>
              <span className="font-mono-code text-[11px] text-[#9A9AA2] px-2 py-0.5 rounded glass-panel-secondary">
                v2.4
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              id="landing-header-login-btn"
              onClick={onSignIn}
              disabled={isLoading}
              className="focus-ring inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-[#E8E8EA] glass-panel-secondary hover:bg-white/[0.09] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5 text-[#9A9AA2]" />
              <span>Sign in with Google</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero & Design Preview Showcase */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 flex flex-col items-center text-center w-full">
        {/* Subtitle Pill */}
        <div className="reveal-panel inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel-secondary text-xs text-[#9A9AA2] mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6EA8FE]" />
          <span>Structured debugging journal for software engineers</span>
        </div>

        {/* Headline */}
        <h1 className="reveal-panel text-3xl sm:text-5xl font-semibold tracking-tight text-[#E8E8EA] max-w-3xl leading-[1.2]">
          A structured debugging journal.
          <span className="block text-[#9A9AA2] font-normal mt-2">
            Not a mood tracker.
          </span>
        </h1>

        <p className="reveal-panel mt-5 text-base sm:text-lg text-[#9A9AA2] max-w-2xl leading-relaxed font-normal">
          Converse with Gemini to diagnose bugs, stack traces, and system bottlenecks. Upon session close, automated JSON Schema extraction distills your root cause, resolution, and tags into an owner-isolated Firestore log.
        </p>

        {authError && (
          <div className="reveal-panel mt-6 p-4 rounded-xl glass-panel border border-red-500/20 text-red-200 text-xs max-w-md text-left flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0" />
            <div>
              <p className="font-semibold text-red-200">Authentication Error</p>
              <p className="mt-0.5 text-red-300/80">{authError}</p>
            </div>
          </div>
        )}

        {/* Primary Action Button (Single blue accent) */}
        <div className="reveal-panel mt-8 flex flex-col sm:flex-row items-center gap-4">
          <button
            id="hero-signin-button"
            onClick={onSignIn}
            disabled={isLoading}
            className="focus-ring w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg text-sm font-medium text-[#0B0C0E] bg-[#6EA8FE] hover:bg-[#86b7fe] transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-[#0B0C0E] border-t-transparent rounded-full animate-spin" />
                Connecting...
              </span>
            ) : (
              <>
                <span>Sign in with Google</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* 3 Core Architecture Pillars in Minimal Glass Panels */}
        <div className="reveal-panel mt-16 w-full grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
          <div className="glass-panel rounded-xl p-5">
            <div className="w-8 h-8 rounded-lg glass-panel-secondary flex items-center justify-center text-[#E8E8EA] mb-3">
              <Terminal className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-[#E8E8EA]">1. Rubber-ducking session</h3>
            <p className="mt-1.5 text-xs text-[#9A9AA2] leading-relaxed">
              Describe race conditions, stack traces, or architecture deadlocks. Gemini guides you with targeted diagnostic questions.
            </p>
          </div>

          <div className="glass-panel rounded-xl p-5">
            <div className="w-8 h-8 rounded-lg glass-panel-secondary flex items-center justify-center text-[#E8E8EA] mb-3">
              <Code2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-[#E8E8EA]">2. Structured schema extraction</h3>
            <p className="mt-1.5 text-xs text-[#9A9AA2] leading-relaxed">
              Upon ending the session, an automated JSON Schema model call extracts title, root cause, resolution, tags, and difficulty.
            </p>
          </div>

          <div className="glass-panel rounded-xl p-5">
            <div className="w-8 h-8 rounded-lg glass-panel-secondary flex items-center justify-center text-[#E8E8EA] mb-3">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-[#E8E8EA]">3. Pattern radar &amp; isolation</h3>
            <p className="mt-1.5 text-xs text-[#9A9AA2] leading-relaxed">
              Aggregates frequent failure tags across your personal logs in Firestore. Identify recurrent blind spots with owner-bound rules.
            </p>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="glass-panel border-t border-white/[0.08] py-4 px-6 text-xs text-[#9A9AA2]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#9A9AA2]" />
            <span>Authenticated with Firebase &bull; Protected with owner-bound Firestore rules</span>
          </div>
          <div>
            <span>Powered by Gemini fallback ladder &bull; Firestore cloud archive</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

