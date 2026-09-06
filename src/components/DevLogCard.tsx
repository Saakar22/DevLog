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
      className={`glass-panel rounded-xl transition-all duration-200 ${
        isExpanded ? "border-white/[0.14] bg-white/[0.05]" : "hover:border-white/[0.12] hover:bg-white/[0.05]"
      }`}
    >
      {/* Primary Card Summary Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 cursor-pointer flex flex-col gap-3"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {/* Resolution badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-[#E8E8EA] glass-panel-secondary">
                <span className={`w-2 h-2 rounded-full ${log.resolved ? "bg-emerald-400" : "bg-amber-400"}`} />
                <span>{log.resolved ? "Resolved" : "In progress"}</span>
              </span>

              {/* Difficulty rating badge */}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-[#9A9AA2] glass-panel-secondary">
                <span>Difficulty:</span>
                <span className="font-medium text-[#E8E8EA]">{log.difficulty} / 5</span>
              </span>

              {/* Language badge if present */}
              {log.language && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-[#9A9AA2] glass-panel-secondary">
                  <FileCode className="w-3.5 h-3.5 text-[#9A9AA2]" />
                  <span>{log.language}</span>
                </span>
              )}

              {/* Duration badge if present */}
              {log.timeSpentMinutes !== undefined && log.timeSpentMinutes !== null && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-[#9A9AA2] glass-panel-secondary">
                  <Clock className="w-3.5 h-3.5 text-[#9A9AA2]" />
                  <span>{log.timeSpentMinutes} min</span>
                </span>
              )}

              {/* Timestamp */}
              <span className="text-xs text-[#9A9AA2] ml-auto hidden sm:inline-block">
                {formattedDate} &bull; {formattedTime}
              </span>
            </div>

            <h3 className="text-base font-medium text-[#E8E8EA] tracking-tight hover:text-[#6EA8FE] transition-colors">
              {log.title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 rounded-lg text-[#9A9AA2] hover:text-red-300 hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-40"
              title="Delete DevLog record"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>

            <div className="p-1.5 text-[#9A9AA2] hover:text-[#E8E8EA]">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Root Cause snippet in preview mode */}
        <p className="text-xs text-[#9A9AA2] line-clamp-2 leading-relaxed">
          <span className="text-[#E8E8EA] font-medium">Root cause:</span> {log.rootCause}
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
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md glass-panel-secondary text-xs text-[#9A9AA2] hover:text-[#E8E8EA] hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <Hash className="w-3 h-3 text-[#9A9AA2]" />
              <span>{tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Expanded Details Section */}
      {isExpanded && (
        <div className="border-t border-white/[0.06] px-5 py-4 space-y-4 text-xs">
          {/* Root Cause & Resolution Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel-secondary rounded-lg p-4">
              <div className="text-xs font-medium text-[#E8E8EA] mb-2 flex items-center gap-2">
                <AlertOctagon className="w-3.5 h-3.5 text-[#9A9AA2]" />
                <span>Root cause</span>
              </div>
              <p className="text-xs text-[#9A9AA2] leading-relaxed whitespace-pre-wrap">
                {log.rootCause}
              </p>
            </div>

            <div className="glass-panel-secondary rounded-lg p-4">
              <div className="text-xs font-medium text-[#E8E8EA] mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#9A9AA2]" />
                <span>Resolution &amp; mitigation</span>
              </div>
              <p className="text-xs text-[#9A9AA2] leading-relaxed whitespace-pre-wrap">
                {log.resolution}
              </p>
            </div>
          </div>

          {/* Transcript Expand Toggle Button */}
          <div className="pt-2 flex items-center justify-between border-t border-white/[0.06]">
            <div className="text-xs text-[#9A9AA2]">
              Transcript ID: <span className="text-[#E8E8EA]">{log.transcriptId}</span>
            </div>

            <button
              onClick={toggleTranscript}
              disabled={isLoadingTranscript}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-panel-secondary hover:bg-white/[0.08] text-[#E8E8EA] text-xs transition-colors cursor-pointer"
            >
              {isLoadingTranscript ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6EA8FE]" />
                  <span>Loading raw transcript...</span>
                </>
              ) : showTranscript ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Hide original chat transcript</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-3.5 h-3.5 text-[#9A9AA2]" />
                  <span>View original chat transcript</span>
                </>
              )}
            </button>
          </div>

          {/* Full Original Chat Transcript viewer */}
          {showTranscript && (
            <div className="mt-3 p-4 rounded-xl glass-panel-secondary max-h-96 overflow-y-auto space-y-3">
              <div className="text-xs text-[#9A9AA2] pb-2 border-b border-white/[0.06] flex items-center justify-between">
                <span>Original rubber-ducking transcript</span>
                <span>{transcript?.messages?.length || 0} messages</span>
              </div>

              {transcript?.messages?.map((msg, i) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id || i}
                    className={`flex flex-col text-xs p-3 rounded-lg ${
                      isUser
                        ? "glass-panel border border-[#6EA8FE]/20"
                        : "glass-panel-secondary"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#9A9AA2] mb-1">
                      <span className="font-medium text-[#E8E8EA]">
                        {isUser ? "You (Developer)" : "Gemini Debugging Copilot"}
                      </span>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-xs text-[#E8E8EA] whitespace-pre-wrap leading-relaxed">
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
