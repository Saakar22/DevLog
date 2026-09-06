import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Terminal, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  ArrowLeft,
  Bot,
  User
} from "lucide-react";
import { ChatMessage, StructuredDevLog } from "../types";

interface SessionChatProps {
  onCancel: () => void;
  onSessionComplete: (structuredLog: StructuredDevLog, messages: ChatMessage[]) => Promise<void>;
}

export const SessionChat: React.FC<SessionChatProps> = ({
  onCancel,
  onSessionComplete,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-msg",
      role: "model",
      content: 
        "DevLog session initialized. What bug, error stack, or architectural puzzle are you stuck on right now?\n\n" +
        "Share relevant logs, snippets, or current hypotheses. We'll diagnose the root cause, dissect the issue, and when you're ready, click 'End Session & Extract Log' to distill this into a structured record.",
      timestamp: Date.now(),
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatusText, setExtractionStatusText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending, isExtracting]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = inputVal.trim();
    if (!cleanText || isSending || isExtracting) return;

    setErrorMsg(null);
    const userMsg: ChatMessage = {
      id: "user_" + Date.now(),
      role: "user",
      content: cleanText,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputVal("");
    setIsSending(true);

    try {
      // Send chat request to /api/chat
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      const modelMsg: ChatMessage = {
        id: "model_" + Date.now(),
        role: "model",
        content: data.text || "No response received.",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setErrorMsg(err.message || "Failed to communicate with debugging assistant.");
    } finally {
      setIsSending(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEndSession = async () => {
    // Only extract if there is at least one user query
    const userMessages = messages.filter((m) => m.role === "user");
    if (userMessages.length === 0) {
      setErrorMsg("Please describe your problem or bug before ending the session.");
      return;
    }

    setIsExtracting(true);
    setErrorMsg(null);
    setExtractionStatusText("Synthesizing debugging transcript via Gemini structured extraction...");

    try {
      // 1. Call Gemini structured extraction endpoint with JSON Schema
      const extractRes = await fetch("/api/extract-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!extractRes.ok) {
        const errData = await extractRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to extract structured log schema.");
      }

      const { log } = await extractRes.json();
      setExtractionStatusText("Persisting structured DevLog and transcript to Firestore...");

      // 2. Persist to Firestore via parent handler
      await onSessionComplete(log, messages);
    } catch (err: any) {
      console.error("Extraction error:", err);
      setErrorMsg(err.message || "Failed to complete structured extraction.");
      setIsExtracting(false);
    }
  };

  const userTurnCount = messages.filter((m) => m.role === "user").length;

  return (
    <div id="session-chat-container" className="flex flex-col h-[calc(100vh-4.5rem)] max-w-5xl mx-auto px-4 py-3">
      {/* Session Topbar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <button
            id="back-to-dashboard-btn"
            onClick={onCancel}
            disabled={isExtracting}
            className="p-1.5 rounded-lg glass-panel-secondary hover:bg-white/[0.08] text-[#9A9AA2] hover:text-[#E8E8EA] transition-colors cursor-pointer disabled:opacity-50"
            title="Cancel session and return"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-sm font-medium text-[#E8E8EA] flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              <span>Active debugging session</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h2>
            <p className="text-xs text-[#9A9AA2]">
              {userTurnCount} user {userTurnCount === 1 ? "turn" : "turns"} recorded
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="end-session-btn"
            onClick={handleEndSession}
            disabled={isSending || isExtracting || userTurnCount === 0}
            className="focus-ring inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#0B0C0E] bg-[#6EA8FE] hover:bg-[#86b7fe] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isExtracting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Extracting schema...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>End session &amp; extract log</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Extraction Overlay if in progress */}
      {isExtracting && (
        <div className="glass-panel my-2 p-3 rounded-xl border border-[#6EA8FE]/30 flex items-center gap-3 text-[#E8E8EA] text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-[#6EA8FE] shrink-0" />
          <span>{extractionStatusText}</span>
        </div>
      )}

      {/* Error alert banner */}
      {errorMsg && (
        <div className="glass-panel my-2 p-3 rounded-xl border border-red-500/30 text-red-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button 
            onClick={() => setErrorMsg(null)}
            className="text-red-300 hover:text-white text-xs px-2 py-0.5 rounded cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 text-sm ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg glass-panel-secondary flex items-center justify-center text-[#E8E8EA] shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[82%] rounded-xl px-4 py-3 leading-relaxed ${
                  isUser
                    ? "glass-panel border border-[#6EA8FE]/20 text-[#E8E8EA]"
                    : "glass-panel-secondary text-[#E8E8EA]"
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-white/[0.06] text-[11px] text-[#9A9AA2]">
                  <span className="font-medium text-[#E8E8EA]">
                    {isUser ? "You (Developer)" : "Gemini Debugging Copilot"}
                  </span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div className="whitespace-pre-wrap break-words text-xs text-[#E8E8EA] leading-relaxed font-sans">
                  {msg.content}
                </div>
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg glass-panel-secondary flex items-center justify-center text-[#9A9AA2] shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isSending && (
          <div className="flex gap-3 text-sm justify-start">
            <div className="w-7 h-7 rounded-lg glass-panel-secondary flex items-center justify-center text-[#E8E8EA] shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-xl glass-panel-secondary text-[#9A9AA2] text-xs flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6EA8FE]" />
              <span>Analyzing stack &amp; formulating diagnostic steps...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Suggestions */}
      {messages.length === 1 && (
        <div className="py-2 flex flex-wrap gap-2">
          {[
            "We have an unexpected race condition when dispatching concurrent state updates.",
            "Unhandled TypeError: Cannot read properties of undefined in production build.",
            "Database connection pool exhaustion under sudden burst spikes.",
            "Why is our CORS preflight failing on custom Authorization headers in Cloud Run?",
          ].map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputVal(suggestion);
                textareaRef.current?.focus();
              }}
              className="text-xs glass-panel-secondary hover:bg-white/[0.08] text-[#9A9AA2] hover:text-[#E8E8EA] px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-left"
            >
              &ldquo;{suggestion}&rdquo;
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <div className="pt-2">
        <form onSubmit={handleSendMessage} className="relative flex flex-col rounded-xl glass-panel p-3 border border-white/[0.08] focus-within:border-[#6EA8FE]/60 focus-within:ring-1 focus-within:ring-[#6EA8FE]/30 transition-all">
          <textarea
            ref={textareaRef}
            id="session-input-textarea"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your error message, code excerpt, or hypothesis... (Shift+Enter for newline)"
            rows={3}
            disabled={isSending || isExtracting}
            className="w-full resize-none bg-transparent px-1 py-0.5 text-xs text-[#E8E8EA] placeholder-[#9A9AA2]/60 focus:outline-none"
          />

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] px-1">
            <div className="text-[11px] text-[#9A9AA2]">
              Press <kbd className="px-1.5 py-0.5 rounded glass-panel-secondary text-[#E8E8EA]">Enter</kbd> to send
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                id="send-message-btn"
                disabled={!inputVal.trim() || isSending || isExtracting}
                className="focus-ring inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#0B0C0E] bg-[#6EA8FE] hover:bg-[#86b7fe] disabled:opacity-40 transition-colors cursor-pointer"
              >
                <span>Send</span>
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
