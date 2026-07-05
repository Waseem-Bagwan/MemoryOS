import { motion, AnimatePresence } from "framer-motion";
import {
  X, MessageSquare, Brain, GitBranch,
  Database, Server, CheckCircle2, Clock,
  AlertTriangle, ChevronRight,
} from "lucide-react";
import type { DecisionLog, DecisionAction } from "../../types";
import { formatDate, formatTime, getActionColor, getActionBg } from "../../lib/utils";

interface ExplainDrawerProps {
  log: DecisionLog | null;
  onClose: () => void;
}

interface StageProps {
  icon: React.ElementType;
  label: string;
  status: "done" | "warn" | "skip";
  detail: React.ReactNode;
  timing?: number;
  delay: number;
}

function Stage({ icon: Icon, label, status, detail, timing, delay }: StageProps) {
  const statusColor = status === "done" ? "text-success border-success/30 bg-success/10"
                    : status === "warn" ? "text-warning border-warning/30 bg-warning/10"
                    :                     "text-muted border-border bg-zinc-800/40";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex gap-3"
    >
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 ${statusColor}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="w-px flex-1 bg-border mt-1 mb-1 min-h-[12px]" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold text-white">{label}</p>
          {timing !== undefined && (
            <span className="text-xs font-mono text-muted">{formatTime(timing)}</span>
          )}
        </div>
        <div className="bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-zinc-300 leading-relaxed">
          {detail}
        </div>
      </div>
    </motion.div>
  );
}

export function ExplainDrawer({ log, onClose }: ExplainDrawerProps) {
  return (
    <AnimatePresence>
      {log && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 h-full w-[480px] bg-surface border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
                  <GitBranch className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Decision Explainer</p>
                  <p className="text-xs text-muted">{formatDate(log.createdAt)}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-white hover:bg-zinc-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action badge */}
            <div className="px-5 py-3 border-b border-border">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-bold font-mono ${getActionBg(log.action as DecisionAction)} ${getActionColor(log.action as DecisionAction)}`}>
                <ChevronRight className="w-3.5 h-3.5" />
                {log.action}
              </div>
              {log.conflictDetected && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-warning">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Conflict detected and resolved
                </div>
              )}
            </div>

            {/* Pipeline stages */}
            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">
                Pipeline Trace
              </p>

              <Stage
                icon={MessageSquare}
                label="User Input"
                status="done"
                detail={<span className="text-white">"{log.inputText}"</span>}
                delay={0.05}
              />

              <Stage
                icon={Brain}
                label="LLM Analysis"
                status="done"
                timing={log.pipelineTiming?.analyze}
                detail={
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted">Reasoning</span>
                      <span className="text-right max-w-[240px]">{log.reasoning}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Importance</span>
                      <span className="font-mono">{log.importance}</span>
                    </div>
                  </div>
                }
                delay={0.1}
              />

              <Stage
                icon={GitBranch}
                label="Decision Made"
                status="done"
                timing={log.pipelineTiming?.execute}
                detail={
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted">Action</span>
                      <span className={`font-mono font-bold ${getActionColor(log.action as DecisionAction)}`}>
                        {log.action}
                      </span>
                    </div>
                    {log.conflictWithId && (
                      <div className="flex justify-between">
                        <span className="text-muted">Conflict with</span>
                        <span className="font-mono text-warning text-xs truncate max-w-[180px]">
                          {log.conflictWithId}
                        </span>
                      </div>
                    )}
                  </div>
                }
                delay={0.15}
              />

              <Stage
                icon={Database}
                label="Cognee (Graph + Vector)"
                status={log.action === "IGNORE" ? "skip" : "done"}
                detail={
                  log.action === "IGNORE"
                    ? <span className="text-muted">Skipped — memory not worth storing</span>
                    : <span>Knowledge graph updated and vectors indexed</span>
                }
                delay={0.2}
              />

              <Stage
                icon={Server}
                label="Redis (Session Cache)"
                status={log.action === "IGNORE" ? "skip" : "done"}
                detail={
                  log.action === "IGNORE"
                    ? <span className="text-muted">Skipped</span>
                    : <span>Importance index updated in sorted set</span>
                }
                delay={0.25}
              />

              <Stage
                icon={CheckCircle2}
                label="Postgres (Metadata)"
                status="done"
                detail={
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted">Decision log</span>
                      <span className="font-mono text-xs truncate max-w-[160px]">{log.id}</span>
                    </div>
                    {log.memoryId && (
                      <div className="flex justify-between">
                        <span className="text-muted">Memory ID</span>
                        <span className="font-mono text-xs truncate max-w-[160px]">{log.memoryId}</span>
                      </div>
                    )}
                  </div>
                }
                delay={0.3}
              />

              {/* Total timing */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="mt-2 pt-4 border-t border-border flex items-center justify-between"
              >
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <Clock className="w-3.5 h-3.5" />
                  Total pipeline latency
                </div>
                <span className="text-sm font-mono font-semibold text-white">
                  {formatTime(log.totalLatencyMs)}
                </span>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}