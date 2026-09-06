import React, { useState } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileCode, 
  Hash, 
  Terminal, 
  Trash2, 
  Calendar,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertOctagon,
  Loader2
} from "lucide-react";
import { DevLogDocument, DevLogTranscript } from "../types";
import { fetchLogTranscript } from "../lib/firebase";

interface DevLogCardProps {
  log: DevLogDocument;
  onTagClick: (tag: string) => void;
  onDeleteLog: (logId: string, transcriptId?: string) => Promise<void>;
  currentUserId: string;
}

export const DevLogCard: React.FC<DevLogCardProps> = ({
  log,
  onTagClick,
  onDeleteLog,
  currentUserId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcript, setTranscript] = useState<DevLogTranscript | null>(null);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleTranscript = async () => {
    if (showTranscript) {
      setShowTranscript(false);
      return;
    }

    if (!transcript && log.transcriptId) {
      setIsLoadingTranscript(true);
      try {
        const loaded = await fetchLogTranscript(currentUserId, log.transcriptId);
        setTranscript(loaded);
      } catch (err) {
        console.error("Failed to load transcript:", err);
      } finally {
        setIsLoadingTranscript(false);
      }
    }
    setShowTranscript(true);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete DevLog: "${log.title}"?`)) return;
    setIsDeleting(true);
    try {
      await onDeleteLog(log.id, log.transcriptId);
    } catch (err) {
      console.error("Failed to delete log:", err);
      setIsDeleting(false);
    }
  };

  const formattedDate = new Date(log.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = new Date(log.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      id={`devlog-item-${log.id}`}
      className={`rounded-xl border transition-all duration-200 ${
        isExpanded
          ? "border-cyan-500/50 bg-slate-900/90 shadow-md ring-1 ring-cyan-500/20"
          : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/70"
      }`}
    >
      {/* Primary Card Summary Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 cursor-pointer flex flex-col gap-3"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
              {/* Resolution badge */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                  log.resolved
                    ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/80"
                    : "bg-amber-950/80 text-amber-400 border border-amber-800/80"
                }`}
              >
                {log.resolved ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>RESOLVED</span>
                  </>
                ) : (
                  <>
                    <AlertOctagon className="w-3 h-3" />
                    <span>IN PROGRESS</span>
                  </>
                )}
              </span>

              {/* Difficulty rating badge */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700">
                <span>DIFF:</span>
                <span className="font-bold text-cyan-400">{log.difficulty}/5</span>
              </span>

              {/* Language badge if present */}
              {log.language && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700">
                  <FileCode className="w-3 h-3 text-cyan-400" />
                  <span className="uppercase">{log.language}</span>
                </span>
              )}

              {/* Duration badge if present */}
              {log.timeSpentMinutes !== undefined && log.timeSpentMinutes !== null && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{log.timeSpentMinutes}m</span>
                </span>
              )}

              {/* Timestamp */}
              <span className="text-[11px] font-mono text-slate-500 ml-auto hidden sm:inline-block">
                {formattedDate} &bull; {formattedTime}
              </span>
            </div>

            <h3 className="text-base font-semibold text-white tracking-tight hover:text-cyan-300 transition">
              {log.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer disabled:opacity-40"
              title="Delete DevLog record"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>

            <div className="p-1.5 text-slate-400 hover:text-slate-200">
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </div>

        {/* Root Cause snippet in preview mode */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-mono">
          <span className="text-slate-500 font-semibold">Root cause:</span> {log.rootCause}
        </p>

        {/* Tags bar */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {log.tags.map((tag) => (
            <button
              key={tag}
              onClick={(e) => {
                e.stopPropagation();
                onTagClick(tag);
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-cyan-950/80 text-[11px] font-mono text-slate-300 hover:text-cyan-300 border border-slate-700/60 hover:border-cyan-800 transition cursor-pointer"
            >
              <Hash className="w-3 h-3 text-slate-500" />
              <span>{tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Expanded Details Section */}
      {isExpanded && (
        <div className="border-t border-slate-800/90 px-5 py-4 bg-slate-950/40 rounded-b-xl space-y-4 text-xs font-mono">
          {/* Root Cause & Resolution Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <h4 className="text-[11px] uppercase tracking-wider font-bold text-red-400/90 mb-1.5 flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5" />
                Root Cause
              </h4>
              <p className="text-slate-300 font-sans leading-relaxed text-xs whitespace-pre-wrap">
                {log.rootCause}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <h4 className="text-[11px] uppercase tracking-wider font-bold text-emerald-400/90 mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Resolution / Mitigation
              </h4>
              <p className="text-slate-300 font-sans leading-relaxed text-xs whitespace-pre-wrap">
                {log.resolution}
              </p>
            </div>
          </div>

          {/* Transcript Expand Toggle Button */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
            <div className="text-[11px] text-slate-500 font-mono">
              Transcript ID: <span className="text-slate-400">{log.transcriptId}</span>
            </div>

            <button
              onClick={toggleTranscript}
              disabled={isLoadingTranscript}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 text-xs font-mono border border-slate-700 transition cursor-pointer"
            >
              {isLoadingTranscript ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading raw transcript...</span>
                </>
              ) : showTranscript ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Hide Full Original Chat Transcript</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>View Full Original Chat Transcript</span>
                </>
              )}
            </button>
          </div>

          {/* Full Original Chat Transcript viewer */}
          {showTranscript && (
            <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-slate-800 max-h-96 overflow-y-auto space-y-3 font-sans">
              <div className="text-[11px] font-mono text-slate-400 pb-2 border-b border-slate-800 flex items-center justify-between">
                <span>ORIGINAL RUBBER-DUCKING TRANSCRIPT</span>
                <span>{transcript?.messages?.length || 0} messages</span>
              </div>

              {transcript?.messages?.map((msg, i) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id || i}
                    className={`flex flex-col text-xs ${
                      isUser
                        ? "p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/40"
                        : "p-3 rounded-lg bg-slate-900 border border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 mb-1">
                      <span className="font-semibold text-slate-300">
                        {isUser ? "You (Developer)" : "Gemini Debugging Copilot"}
                      </span>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
