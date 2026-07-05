import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, Cpu, User } from "lucide-react";
import { cn } from "../../lib/utils";
import type { ChatMessage as ChatMessageType } from "../../types";

interface Props {
  message: ChatMessageType;
  index: number;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-zinc-700 text-muted hover:text-white"
    >
      {copied
        ? <Check className="w-3.5 h-3.5 text-success" />
        : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export function ChatMessage({ message, index }: Props) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className={cn("flex gap-3 group", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
        isUser
          ? "bg-primary/20 border border-primary/30"
          : "bg-zinc-800 border border-zinc-700"
      )}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-primary" />
          : <Cpu className="w-3.5 h-3.5 text-muted" />
        }
      </div>

      {/* Bubble */}
      <div className={cn(
        "max-w-[78%] rounded-2xl px-4 py-3 relative",
        isUser
          ? "bg-primary/15 border border-primary/20 text-white rounded-tr-sm"
          : "bg-surface border border-border text-zinc-200 rounded-tl-sm"
      )}>
        {/* Copy button for assistant */}
        {!isUser && (
          <div className="absolute top-2 right-2">
            <CopyButton text={message.content} />
          </div>
        )}

        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none
            prose-p:my-1 prose-headings:text-white prose-code:text-secondary
            prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className ?? "");
                  const isBlock = !!match;
                  if (isBlock) {
                    return (
                      <div className="my-2 rounded-xl overflow-hidden border border-zinc-700">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800/80 border-b border-zinc-700">
                          <span className="text-xs text-muted font-mono">{match[1]}</span>
                          <CopyButton text={String(children)} />
                        </div>
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{
                            margin: 0, padding: "12px",
                            background: "#0d0d10", fontSize: "12px",
                          }}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      </div>
                    );
                  }
                  return (
                    <code
                      className="bg-zinc-800 text-secondary px-1.5 py-0.5 rounded-md text-xs font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Memory info */}
        {!isUser && message.memoriesUsed !== undefined && message.memoriesUsed > 0 && (
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/50">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-xs text-muted">
              {message.memoriesUsed} {message.memoriesUsed === 1 ? "memory" : "memories"} used
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}