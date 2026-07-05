import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({ value, onChange, onSend, isLoading, disabled }: ChatInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) onSend();
    }
  }

  const canSend = value.trim().length > 0 && !isLoading && !disabled;

  return (
    <div className="p-4 border-t border-border bg-background/50">
      <div className="max-w-3xl mx-auto">
        <div className={cn(
          "flex items-end gap-3 bg-surface border rounded-2xl px-4 py-3 transition-colors",
          "border-border focus-within:border-primary/40"
        )}>
          <textarea
            ref={ref}
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message... (Enter to send, Shift+Enter for new line)"
            rows={1}
            disabled={isLoading || disabled}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-muted/50 resize-none focus:outline-none leading-relaxed min-h-[24px] max-h-[180px] disabled:opacity-50"
          />

          <motion.button
            onClick={onSend}
            disabled={!canSend}
            whileHover={canSend ? { scale: 1.05 } : {}}
            whileTap={canSend ? { scale: 0.95 } : {}}
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200",
              canSend
                ? "bg-primary hover:bg-primary/90 text-white shadow-glow-sm"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            )}
          >
            {isLoading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Send className="w-3.5 h-3.5" />
            }
          </motion.button>
        </div>

        <p className="text-center text-xs text-zinc-700 mt-2">
          MemoryOS remembers everything · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}