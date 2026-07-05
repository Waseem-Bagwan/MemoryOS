import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Plus, Sparkles } from "lucide-react";
import { chatApi, memoryApi } from "../../api";
import { ChatMessage } from "../../components/chat/ChatMessage";
import { TypingIndicator } from "../../components/chat/TypingIndicator";
import { ChatInput } from "../../components/chat/ChatInput";
import { DecisionEngine } from "../../components/decision/DecisionEngine";
import { generateSessionId } from "../../lib/utils";
import type { ChatMessage as ChatMessageType, MemoryDecision } from "../../types";

// Persist session ID across page refreshes
function getSessionId(): string {
  const stored = sessionStorage.getItem("memoryos_session");
  if (stored) return stored;
  const id = generateSessionId();
  sessionStorage.setItem("memoryos_session", id);
  return id;
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full text-center px-6"
    >
      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
        <Brain className="w-7 h-7 text-primary" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">
        Start a conversation
      </h2>
      <p className="text-muted text-sm max-w-sm leading-relaxed mb-6">
        MemoryOS remembers everything you share. Watch the Memory Engine
        panel to see exactly what gets stored and why.
      </p>
      <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
        {[
          "I'm a TypeScript developer building AI tools",
          "My favorite food is biryani",
          "I prefer dark mode and minimal UIs",
        ].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => {
              // bubble up via custom event so Chat can pick it up
              window.dispatchEvent(
                new CustomEvent("suggestion", { detail: suggestion })
              );
            }}
            className="text-left px-4 py-2.5 rounded-xl bg-surface border border-border hover:border-primary/30 hover:bg-primary/5 text-sm text-muted hover:text-white transition-all duration-150"
          >
            <Sparkles className="w-3.5 h-3.5 inline mr-2 text-primary opacity-60" />
            {suggestion}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export default function Chat() {
  const [messages, setMessages]           = useState<ChatMessageType[]>([]);
  const [input, setInput]                 = useState("");
  const [isLoading, setIsLoading]         = useState(false);
  const [isProcessing, setIsProcessing]   = useState(false);
  const [lastDecision, setLastDecision]   = useState<MemoryDecision | null>(null);
  const [error, setError]                 = useState("");
  const [sessionId]                       = useState(getSessionId);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Listen for suggestion clicks from EmptyState
  useEffect(() => {
    function handleSuggestion(e: Event) {
      const text = (e as CustomEvent<string>).detail;
      setInput(text);
    }
    window.addEventListener("suggestion", handleSuggestion);
    return () => window.removeEventListener("suggestion", handleSuggestion);
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    // Optimistically add user message
    const userMsg: ChatMessageType = {
      id:        `user-${Date.now()}`,
      role:      "user",
      content:   text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setIsProcessing(true);
    setLastDecision(null);
    setError("");

    try {
      const res = await chatApi.sendMessage(text, sessionId);
      const data = res.data.data!;

      // Add assistant reply
      const assistantMsg: ChatMessageType = {
        id:           `assistant-${Date.now()}`,
        role:         "assistant",
        content:      data.reply,
        timestamp:    new Date(),
        memoriesUsed: data.memoriesUsed,
        memoryContext: data.memoryContext,
      };

      setMessages(prev => [...prev, assistantMsg]);

      // The chat endpoint returns the reply but memory ingestion
      // happens async in the background. We poll for the latest
      // decision to show in the panel.
      // Since the backend returns no decision from /chat/message,
      // we show the memoriesUsed count as a proxy.
      // If you want the full decision, call /memory/ingest directly.
      // For now, build a synthetic decision summary from the response.
      if (data.memoriesUsed >= 0) {
        // Trigger a separate ingest to get the actual decision
        // This runs async and updates the panel when ready
        setIsProcessing(true);
        try {
          const ingestRes = await memoryApi.ingest(text, sessionId);
          const decision  = ingestRes.data.data?.decision;
          if (decision) setLastDecision(decision);
        } catch {
          // Ingest might fail if memory lock is held — that's fine
          // The chat still worked, just no decision panel update
        } finally {
          setIsProcessing(false);
        }
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? "Something went wrong. Please try again.";
      setError(msg);
      // Remove the optimistic user message on error
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, sessionId]);

  function handleNewSession() {
    sessionStorage.removeItem("memoryos_session");
    window.location.reload();
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Left: Chat (70%) ─────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Chat header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-background/80 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse-slow" />
            <span className="text-sm font-medium text-white">AI Agent</span>
            <span className="text-xs text-muted font-mono hidden sm:block truncate max-w-[160px]">
              {sessionId}
            </span>
          </div>
          <button
            onClick={handleNewSession}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted hover:text-white hover:bg-zinc-800 transition-all border border-transparent hover:border-border"
          >
            <Plus className="w-3.5 h-3.5" />
            New session
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <ChatMessage key={msg.id} message={msg} index={i} />
                ))}
                {isLoading && !error && (
                  <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <TypingIndicator />
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-3 px-4 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger"
                >
                  {error}
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0">
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={sendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* ── Right: Decision Engine (30%) ─────────────────────── */}
      <div className="w-80 xl:w-96 flex-shrink-0 hidden lg:block">
        <DecisionEngine
          decision={lastDecision}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
}