import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Terminal, 
  LogOut, 
  RefreshCw, 
  AlertCircle, 
  Hash, 
  SlidersHorizontal,
  Layers,
  Bug,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ListFilter
} from "lucide-react";
import { User } from "firebase/auth";
import { DevLogDocument, StructuredDevLog, ChatMessage } from "../types";
import { 
  fetchUserDevLogs, 
  saveDevLogWithTranscript, 
  deleteUserDevLog, 
  logOut 
} from "../lib/firebase";
import { PatternRadar } from "./PatternRadar";
import { DevLogCard } from "./DevLogCard";
import { SessionChat } from "./SessionChat";

interface DashboardViewProps {
  user: User;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user }) => {
  const [logs, setLogs] = useState<DevLogDocument[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [resolutionFilter, setResolutionFilter] = useState<"all" | "resolved" | "unresolved">("all");
  const [statusNotification, setStatusNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Load user-isolated DevLogs
  const loadLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const userLogs = await fetchUserDevLogs(user.uid);
      setLogs(userLogs);
    } catch (err: any) {
      console.error("Failed to load user logs:", err);
      setStatusNotification({
        message: err.message || "Failed to load DevLogs from Firestore.",
        type: "error",
      });
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [user.uid]);

  // Handler for saving a newly completed session
  const handleSessionComplete = async (structuredLog: StructuredDevLog, messages: ChatMessage[]) => {
    try {
      const { logId, transcriptId } = await saveDevLogWithTranscript(user.uid, structuredLog, messages);
      setIsStartingSession(false);
      setStatusNotification({
        message: `DevLog "${structuredLog.title}" successfully archived with structured schema.`,
        type: "success",
      });
      // Refresh user log history
      await loadLogs();
    } catch (err: any) {
      console.error("Failed to save DevLog:", err);
      throw new Error(err.message || "Firestore persistence failed.");
    }
  };

  const handleDeleteLog = async (logId: string, transcriptId?: string) => {
    try {
      await deleteUserDevLog(user.uid, logId, transcriptId);
      setLogs((prev) => prev.filter((l) => l.id !== logId));
      setStatusNotification({
        message: "Log and transcript removed.",
        type: "success",
      });
    } catch (err: any) {
      console.error("Delete error:", err);
      setStatusNotification({
        message: "Failed to delete record.",
        type: "error",
      });
    }
  };

  // Filtered logs computed cleanly
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Resolution status
      if (resolutionFilter === "resolved" && !log.resolved) return false;
      if (resolutionFilter === "unresolved" && log.resolved) return false;

      // Tag filter
      if (selectedTag) {
        const matchesTag = log.tags.some(
          (t) => t.toLowerCase() === selectedTag.toLowerCase()
        );
        if (!matchesTag) return false;
      }

      // Search term (title, rootCause, resolution, tags, language)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const inTitle = log.title.toLowerCase().includes(query);
        const inRootCause = log.rootCause.toLowerCase().includes(query);
        const inResolution = log.resolution.toLowerCase().includes(query);
        const inLanguage = log.language?.toLowerCase().includes(query) || false;
        const inTags = log.tags.some((t) => t.toLowerCase().includes(query));
        if (!inTitle && !inRootCause && !inResolution && !inLanguage && !inTags) {
          return false;
        }
      }

      return true;
    });
  }, [logs, selectedTag, resolutionFilter, searchTerm]);

  return (
    <div id="dashboard-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* App Topbar */}
      <header id="dashboard-nav" className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <span className="font-mono text-base font-bold text-white tracking-tight flex items-center gap-2">
                DevLog <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 border border-cyan-800 px-1.5 py-0.2 rounded">Console</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* User profile indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-300 truncate max-w-[180px]">
                {user.displayName || user.email}
              </span>
            </div>

            {/* New Log Action button */}
            {!isStartingSession && (
              <button
                id="dashboard-new-log-btn"
                onClick={() => {
                  setStatusNotification(null);
                  setIsStartingSession(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Log</span>
              </button>
            )}

            {/* Logout button */}
            <button
              id="dashboard-logout-btn"
              onClick={() => logOut()}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Notification Toast */}
      {statusNotification && (
        <div className="max-w-7xl mx-auto px-6 pt-3 w-full">
          <div
            className={`p-3 rounded-lg text-xs font-mono flex items-center justify-between border ${
              statusNotification.type === "success"
                ? "bg-emerald-950/70 border-emerald-800 text-emerald-300"
                : "bg-red-950/70 border-red-800 text-red-300"
            }`}
          >
            <span>{statusNotification.message}</span>
            <button
              onClick={() => setStatusNotification(null)}
              className="underline text-[11px] cursor-pointer ml-4"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Active Session Mode */}
      {isStartingSession ? (
        <SessionChat
          onCancel={() => setIsStartingSession(false)}
          onSessionComplete={handleSessionComplete}
        />
      ) : (
        <main className="flex-1 max-w-7xl mx-auto px-6 py-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left/Main Column: Log History & Search */}
            <div className="lg:col-span-8 space-y-4">
              {/* Filter & Search Bar */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      id="search-logs-input"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search title, root cause, language, tags..."
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-2.5 top-2.5 text-[10px] font-mono text-slate-500 hover:text-slate-300"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Resolution quick toggle */}
                  <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                    <button
                      onClick={() => setResolutionFilter("all")}
                      className={`px-2.5 py-1 rounded cursor-pointer transition ${
                        resolutionFilter === "all"
                          ? "bg-slate-800 text-white font-medium"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      All ({logs.length})
                    </button>
                    <button
                      onClick={() => setResolutionFilter("resolved")}
                      className={`px-2.5 py-1 rounded cursor-pointer transition ${
                        resolutionFilter === "resolved"
                          ? "bg-emerald-950 text-emerald-300 font-medium"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Resolved
                    </button>
                    <button
                      onClick={() => setResolutionFilter("unresolved")}
                      className={`px-2.5 py-1 rounded cursor-pointer transition ${
                        resolutionFilter === "unresolved"
                          ? "bg-amber-950 text-amber-300 font-medium"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      In Progress
                    </button>
                  </div>
                </div>

                {/* Active Filters Tag Bar */}
                {(selectedTag || searchTerm || resolutionFilter !== "all") && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60 text-xs font-mono">
                    <span className="text-slate-500 flex items-center gap-1">
                      <ListFilter className="w-3.5 h-3.5" />
                      Active filters:
                    </span>
                    {selectedTag && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                        tag: #{selectedTag}
                        <button onClick={() => setSelectedTag(null)} className="ml-1 hover:text-white">&times;</button>
                      </span>
                    )}
                    {searchTerm && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        query: &ldquo;{searchTerm}&rdquo;
                        <button onClick={() => setSearchTerm("")} className="ml-1 hover:text-white">&times;</button>
                      </span>
                    )}
                    {resolutionFilter !== "all" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        status: {resolutionFilter}
                        <button onClick={() => setResolutionFilter("all")} className="ml-1 hover:text-white">&times;</button>
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setSelectedTag(null);
                        setSearchTerm("");
                        setResolutionFilter("all");
                      }}
                      className="text-slate-500 hover:text-slate-300 underline text-[11px] ml-auto cursor-pointer"
                    >
                      Reset all
                    </button>
                  </div>
                )}
              </div>

              {/* DevLogs Feed */}
              {isLoadingLogs ? (
                <div className="py-16 text-center text-slate-500 font-mono text-xs flex flex-col items-center gap-3">
                  <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span>Loading user-isolated DevLogs from Firestore...</span>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-800/80 text-cyan-400 flex items-center justify-center mx-auto mb-4">
                    <Bug className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-semibold font-mono text-white">No logs found</h4>
                  <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                    {logs.length === 0
                      ? "Your journal is empty. Click 'New Log' to launch a rubber-ducking debugging session with Gemini."
                      : "No records match your active tag or search filters."}
                  </p>
                  {logs.length === 0 ? (
                    <button
                      onClick={() => setIsStartingSession(true)}
                      className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Start First Debugging Session</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedTag(null);
                        setSearchTerm("");
                        setResolutionFilter("all");
                      }}
                      className="mt-4 text-xs font-mono text-cyan-400 underline cursor-pointer"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500 px-1">
                    <span>SHOWING {filteredLogs.length} OF {logs.length} LOGS</span>
                    <button
                      onClick={loadLogs}
                      className="flex items-center gap-1 hover:text-slate-300 cursor-pointer"
                      title="Refresh logs from Firestore"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Sync</span>
                    </button>
                  </div>

                  {filteredLogs.map((log) => (
                    <DevLogCard
                      key={log.id}
                      log={log}
                      onTagClick={(tag) => setSelectedTag(tag)}
                      onDeleteLog={handleDeleteLog}
                      currentUserId={user.uid}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Pattern Radar & Quick Insights */}
            <div className="lg:col-span-4 space-y-4">
              <PatternRadar
                logs={logs}
                selectedTag={selectedTag}
                onSelectTag={(tag) => setSelectedTag(tag)}
              />

              {/* Developer Journaling Guide */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-xs font-mono text-slate-400 space-y-2.5">
                <div className="flex items-center gap-2 text-slate-200 font-semibold">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>The DevLog Philosophy</span>
                </div>
                <p className="leading-relaxed text-[11.5px]">
                  Traditional journals capture sentiment; DevLog captures technical mechanism. Use sessions to dissect race conditions, memory leaks, and off-by-one errors.
                </p>
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Owner-bound Firestore isolation</span>
                  </div>
                  <div className="flex items-center gap-2 text-cyan-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Gemini JSON Schema enforcement</span>
                  </div>
                  <div className="flex items-center gap-2 text-teal-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Resilient 4-model fallback ladder</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
};
