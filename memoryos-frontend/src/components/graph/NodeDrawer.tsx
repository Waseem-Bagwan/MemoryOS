import { motion, AnimatePresence } from "framer-motion";
import { X, Brain, Clock, Tag, Layers, Hash } from "lucide-react";
import type { Memory, MemoryType } from "../../types";
import { formatDate, getTypeColor } from "../../lib/utils";

interface NodeDrawerProps {
  type: MemoryType | null;
  memories: Memory[];
  onClose: () => void;
}

const TYPE_LABELS: Record<MemoryType, string> = {
  profile:    "Profile",
  preference: "Preferences",
  knowledge:  "Knowledge",
  experience:  "Experience",
};

function ImportanceBar({ value }: { value: number }) {
  const color = value >= 0.7 ? "bg-success" : value >= 0.4 ? "bg-warning" : "bg-muted";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs font-mono text-muted">{(value * 100).toFixed(0)}%</span>
    </div>
  );
}

export function NodeDrawer({ type, memories, onClose }: NodeDrawerProps) {
  const filtered = memories.filter(m => m.type === type);

  return (
    <AnimatePresence>
      {type && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 h-full w-96 bg-surface border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <Brain className="w-4.5 h-4.5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-white">{TYPE_LABELS[type]}</p>
                  <p className="text-xs text-muted">{filtered.length} {filtered.length === 1 ? "memory" : "memories"}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-white hover:bg-zinc-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Memory list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <Brain className="w-10 h-10 text-zinc-700 mb-3" />
                  <p className="text-sm text-muted">No {type} memories yet</p>
                  <p className="text-xs text-zinc-600 mt-1">Start chatting to build this category</p>
                </div>
              ) : (
                filtered.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-background border border-border rounded-xl p-4 space-y-3"
                  >
                    {/* Content */}
                    <p className="text-sm text-white font-medium leading-snug">{m.content}</p>

                    {/* Type + lifecycle */}
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${getTypeColor(m.type)}`}>
                        {m.type}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${
                        m.lifecycle === "active"   ? "bg-success/10 text-success border-success/20"   :
                        m.lifecycle === "archived" ? "bg-warning/10 text-warning border-warning/20"   :
                                                     "bg-danger/10 text-danger border-danger/20"
                      }`}>
                        {m.lifecycle}
                      </span>
                    </div>

                    {/* Importance */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted flex items-center gap-1">
                          <Layers className="w-3 h-3" /> Importance
                        </span>
                      </div>
                      <ImportanceBar value={m.importance} />
                    </div>

                    {/* Tags */}
                    {m.tags.length > 0 && (
                      <div>
                        <p className="text-xs text-muted flex items-center gap-1 mb-1.5">
                          <Tag className="w-3 h-3" /> Tags
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {m.tags.map(t => (
                            <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="space-y-1 pt-1 border-t border-border/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Created
                        </span>
                        <span className="text-xs font-mono text-zinc-400">{formatDate(m.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Accessed
                        </span>
                        <span className="text-xs font-mono text-zinc-400">{formatDate(m.lastAccessedAt)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted flex items-center gap-1">
                          <Hash className="w-3 h-3" /> ID
                        </span>
                        <span className="text-xs font-mono text-zinc-600 truncate max-w-[140px]">{m.id}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}