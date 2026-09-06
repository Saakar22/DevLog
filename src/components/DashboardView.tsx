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
    <div id="dashboard-container" className="min-h-screen text-[#E8E8EA] flex flex-col selection:bg-[#6EA8FE]/20 selection:text-[#E8E8EA]">
      {/* App Topbar */}
      <header id="dashboard-nav" className="glass-panel sticky top-0 z-30 px-6 py-3 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg glass-panel-secondary flex items-center justify-center text-[#E8E8EA]">
              <Terminal className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono-code text-base font-semibold text-[#E8E8EA] tracking-tight">
                DevLog
              </span>
              <span className="font-mono-code text-[11px] text-[#9A9AA2] px-2 py-0.5 rounded glass-panel-secondary">
                Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User profile indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg glass-panel-secondary text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[#9A9AA2] truncate max-w-[180px]">
                {user.displayName || user.email}
              </span>
            </div>

            {/* New Log Action button (Single blue accent) */}
            {!isStartingSession && (
              <button
                id="dashboard-new-log-btn"
                onClick={() => {
                  setStatusNotification(null);
                  setIsStartingSession(true);
                }}
                className="focus-ring inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#0B0C0E] bg-[#6EA8FE] hover:bg-[#86b7fe] transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Log</span>
              </button>
            )}

            {/* Logout button */}
            <button
              id="dashboard-logout-btn"
              onClick={() => logOut()}
              className="p-1.5 rounded-lg text-[#9A9AA2] hover:text-[#E8E8EA] glass-panel-secondary hover:bg-white/[0.08] transition-colors cursor-pointer"
              title="Sign out"
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
            className={`p-3 rounded-xl text-xs flex items-center justify-between glass-panel border ${
              statusNotification.type === "success"
                ? "border-emerald-500/30 text-emerald-300"
                : "border-red-500/30 text-red-300"
            }`}
          >
            <span>{statusNotification.message}</span>
            <button
              onClick={() => setStatusNotification(null)}
              className="underline text-[11px] cursor-pointer ml-4 text-[#9A9AA2] hover:text-[#E8E8EA]"
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
              <div className="glass-panel rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#9A9AA2] absolute left-3 top-2.5" />
                    <input
                      id="search-logs-input"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search title, root cause, language, tags..."
                      className="focus-ring w-full pl-9 pr-3 py-2 rounded-lg glass-panel-secondary text-xs text-[#E8E8EA] placeholder-[#9A9AA2]/60 focus:outline-none"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-2.5 top-2.5 text-[11px] text-[#9A9AA2] hover:text-[#E8E8EA]"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Resolution quick toggle */}
                  <div className="flex items-center gap-1 glass-panel-secondary p-1 rounded-lg text-xs">
                    <button
                      onClick={() => setResolutionFilter("all")}
                      className={`px-3 py-1 rounded cursor-pointer transition-colors ${
                        resolutionFilter === "all"
                          ? "bg-white/[0.08] text-[#E8E8EA] font-medium"
                          : "text-[#9A9AA2] hover:text-[#E8E8EA]"
                      }`}
                    >
                      All ({logs.length})
                    </button>
                    <button
                      onClick={() => setResolutionFilter("resolved")}
                      className={`px-3 py-1 rounded cursor-pointer transition-colors ${
                        resolutionFilter === "resolved"
                          ? "bg-white/[0.08] text-[#E8E8EA] font-medium"
                          : "text-[#9A9AA2] hover:text-[#E8E8EA]"
                      }`}
                    >
                      Resolved
                    </button>
                    <button
                      onClick={() => setResolutionFilter("unresolved")}
                      className={`px-3 py-1 rounded cursor-pointer transition-colors ${
                        resolutionFilter === "unresolved"
                          ? "bg-white/[0.08] text-[#E8E8EA] font-medium"
                          : "text-[#9A9AA2] hover:text-[#E8E8EA]"
                      }`}
                    >
                      In progress
                    </button>
                  </div>
                </div>

                {/* Active Filters Tag Bar */}
                {(selectedTag || searchTerm || resolutionFilter !== "all") && (
                  <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06] text-xs">
                    <span className="text-[#9A9AA2] flex items-center gap-1">
                      <ListFilter className="w-3.5 h-3.5" />
                      Active filters:
                    </span>
                    {selectedTag && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded glass-panel-secondary text-[#E8E8EA]">
                        tag: #{selectedTag}
                        <button onClick={() => setSelectedTag(null)} className="ml-1 text-[#9A9AA2] hover:text-white">&times;</button>
                      </span>
                    )}
                    {searchTerm && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded glass-panel-secondary text-[#E8E8EA]">
                        query: &ldquo;{searchTerm}&rdquo;
                        <button onClick={() => setSearchTerm("")} className="ml-1 text-[#9A9AA2] hover:text-white">&times;</button>
                      </span>
                    )}
                    {resolutionFilter !== "all" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded glass-panel-secondary text-[#E8E8EA]">
                        status: {resolutionFilter === "resolved" ? "Resolved" : "In progress"}
                        <button onClick={() => setResolutionFilter("all")} className="ml-1 text-[#9A9AA2] hover:text-white">&times;</button>
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setSelectedTag(null);
                        setSearchTerm("");
                        setResolutionFilter("all");
                      }}
                      className="text-[#9A9AA2] hover:text-[#E8E8EA] underline text-[11px] ml-auto cursor-pointer"
                    >
                      Reset all
                    </button>
                  </div>
                )}
              </div>

              {/* DevLogs Feed */}
              {isLoadingLogs ? (
                <div className="py-16 text-center text-[#9A9AA2] text-xs flex flex-col items-center gap-3">
                  <div className="w-5 h-5 border-2 border-[#6EA8FE] border-t-transparent rounded-full animate-spin" />
                  <span>Loading user-isolated DevLogs from Firestore...</span>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="glass-panel rounded-xl p-12 text-center">
                  <div className="w-10 h-10 rounded-xl glass-panel-secondary text-[#E8E8EA] flex items-center justify-center mx-auto mb-4">
                    <Bug className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-medium text-[#E8E8EA]">No logs found</h4>
                  <p className="mt-1 text-xs text-[#9A9AA2] max-w-sm mx-auto">
                    {logs.length === 0
                      ? "Your journal is empty. Click 'New Log' to launch a rubber-ducking debugging session with Gemini."
                      : "No records match your active tag or search filters."}
                  </p>
                  {logs.length === 0 ? (
                    <button
                      onClick={() => setIsStartingSession(true)}
                      className="focus-ring mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-[#0B0C0E] bg-[#6EA8FE] hover:bg-[#86b7fe] transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Start first debugging session</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedTag(null);
                        setSearchTerm("");
                        setResolutionFilter("all");
                      }}
                      className="mt-4 text-xs text-[#6EA8FE] hover:underline cursor-pointer"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#9A9AA2] px-1">
                    <span>Showing {filteredLogs.length} of {logs.length} logs</span>
                    <button
                      onClick={loadLogs}
                      className="flex items-center gap-1 hover:text-[#E8E8EA] cursor-pointer transition-colors"
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
              <div className="glass-panel rounded-xl p-5 text-xs text-[#9A9AA2] space-y-3">
                <div className="flex items-center gap-2 text-[#E8E8EA] font-medium">
                  <Terminal className="w-4 h-4" />
                  <span>The DevLog philosophy</span>
                </div>
                <p className="leading-relaxed text-xs">
                  Traditional journals capture sentiment; DevLog captures technical mechanism. Use sessions to dissect race conditions, memory leaks, and architectural deadlocks.
                </p>
                <div className="pt-2 border-t border-white/[0.06] space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-[#E8E8EA]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#9A9AA2]" />
                    <span>Owner-bound Firestore isolation</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#E8E8EA]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#9A9AA2]" />
                    <span>Gemini JSON Schema enforcement</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#E8E8EA]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#9A9AA2]" />
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
