import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu, Zap, Brain, Clock, Tag, AlertTriangle,
  Database, Server, CheckCircle2, XCircle, RefreshCw,
  MinusCircle, GitMerge,
} from "lucide-react";
import type { MemoryDecision, DecisionAction } from "../../types";
import { formatTime } from "../../lib/utils";

interface DecisionEngineProps {
  decision: MemoryDecision | null;
  isProcessing: boolean;
}

const ACTION_CONFIG: Record<DecisionAction, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  description: string;
}> = {
  STORE: {
    label: "STORE",
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
    description: "New memory created",
  },
  UPDATE: {
    label: "UPDATE",
    icon: RefreshCw,
    color: "text-secondary",
    bg: "bg-secondary/10",
    border: "border-secondary/30",
    description: "Existing memory updated",
  },
  MERGE: {
    label: "MERGE",
    icon: GitMerge,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    description: "Memories combined",
  },
  IGNORE: {
    label: "IGNORE",
    icon: MinusCircle,
    color: "text-muted",
    bg: "bg-zinc-800/50",
    border: "border-zinc-700/50",
    description: "Not worth storing",
  },
  FORGET: {
    label: "FORGET",
    icon: XCircle,
    color: "text-danger",
    bg: "bg-danger/10",
    border: "border-danger/30",
    description: "Memory removed",
  },
};

function ActionBadge({ action }: { action: DecisionAction }) {
  const config = ACTION_CONFIG[action];
  const Icon   = config.icon;

  const animations: Record<DecisionAction, object> = {
    STORE:  { scale: [1, 1.08, 1], transition: { duration: 0.5 } },
    UPDATE: { x: [0, -3, 3, 0],   transition: { duration: 0.4 } },
    MERGE:  { scale: [1.1, 0.95, 1.05, 1], transition: { duration: 0.6 } },
    IGNORE: { opacity: [1, 0.4, 1], transition: { duration: 0.6 } },
    FORGET: { scale: [1, 0.9, 1],  transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      key={action}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1, ...animations[action] }}
      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${config.bg} ${config.border}`}
    >
      <Icon className={`w-5 h-5 ${config.color}`} />
      <div>
        <p className={`text-sm font-bold font-mono tracking-wide ${config.color}`}>
          {config.label}
        </p>
        <p className="text-xs text-muted">{config.description}</p>
      </div>

      {/* Pulse for STORE */}
      {action === "STORE" && (
        <motion.div
          className="ml-auto w-2 h-2 rounded-full bg-success"
          animate={{ scale: [1, 1.8, 1], opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: 3 }}
        />
      )}
      {/* Spinner for UPDATE */}
      {action === "UPDATE" && (
        <motion.div
          className="ml-auto"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, ease: "linear", repeat: 2 }}
        >
          <RefreshCw className="w-3 h-3 text-secondary" />
        </motion.div>
      )}
    </motion.div>
  );
}

function ImportanceBar({ value }: { value: number }) {
  const color = value >= 0.7 ? "bg-success" : value >= 0.4 ? "bg-warning" : "bg-muted";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs font-mono text-muted w-8 text-right">
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  );
}

function PipelineStage({
  label, value, icon: Icon, delay
}: {
  label: string; value: string; icon: React.ElementType; delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0"
    >
      <div className="flex items-center gap-2 text-xs text-muted">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <span className="text-xs font-mono text-zinc-300">{value}</span>
    </motion.div>
  );
}

export function DecisionEngine({ decision, isProcessing }: DecisionEngineProps) {
  return (
    <div className="h-full flex flex-col bg-surface border-l border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-border flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
          <Cpu className="w-3.5 h-3.5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Memory Engine</p>
          <p className="text-xs text-muted">Live decision output</p>
        </div>
        {isProcessing && (
          <motion.div
            className="ml-auto flex items-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-primary"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
            <span className="text-xs text-muted">Processing</span>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="wait">
          {!decision && !isProcessing ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-40 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center mb-3">
                <Brain className="w-5 h-5 text-zinc-600" />
              </div>
              <p className="text-sm text-muted">Send a message to see</p>
              <p className="text-xs text-zinc-600 mt-0.5">memory decisions in real time</p>
            </motion.div>
          ) : isProcessing && !decision ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {["Analyzing message...", "Checking existing memories...", "Making decision..."].map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.3 }}
                  className="flex items-center gap-2.5 py-2 px-3 bg-zinc-800/40 rounded-lg"
                >
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                  />
                  <span className="text-xs text-muted">{step}</span>
                </motion.div>
              ))}
            </motion.div>
          ) : decision ? (
            <motion.div
              key={`${decision.action}-${decision.importance}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Action */}
              <ActionBadge action={decision.action} />

              {/* Distilled memory */}
              {decision.distilledContent && decision.action !== "IGNORE" && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-zinc-800/60 rounded-xl p-3 border border-zinc-700/50"
                >
                  <p className="text-xs text-muted mb-1 font-medium">Stored as</p>
                  <p className="text-sm text-white font-medium">"{decision.distilledContent}"</p>
                </motion.div>
              )}

              {/* Reasoning */}
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-zinc-800/40 rounded-xl p-3"
              >
                <p className="text-xs text-muted mb-1.5 font-medium flex items-center gap-1.5">
                  <Brain className="w-3 h-3" /> Reasoning
                </p>
                <p className="text-xs text-zinc-300 leading-relaxed">{decision.reasoning}</p>
              </motion.div>

              {/* Memory type + scores */}
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Memory type</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                    decision.memoryType === "profile"    ? "bg-purple-500/15 text-purple-400" :
                    decision.memoryType === "preference" ? "bg-cyan-500/15 text-cyan-400"    :
                    decision.memoryType === "knowledge"  ? "bg-amber-500/15 text-amber-400"  :
                                                           "bg-emerald-500/15 text-emerald-400"
                  }`}>
                    {decision.memoryType}
                  </span>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-muted">Importance</span>
                  </div>
                  <ImportanceBar value={decision.importance} />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-muted">Confidence</span>
                  </div>
                  <ImportanceBar value={decision.confidence} />
                </div>
              </motion.div>

              {/* Tags */}
              {decision.tags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <p className="text-xs text-muted mb-2 flex items-center gap-1.5">
                    <Tag className="w-3 h-3" /> Tags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {decision.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Conflict */}
              {decision.conflictDetected && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 }}
                  className="flex items-center gap-2 px-3 py-2 bg-warning/10 border border-warning/20 rounded-xl"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
                  <p className="text-xs text-warning">Conflict detected and resolved</p>
                </motion.div>
              )}

              {/* Pipeline stages */}
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-zinc-800/40 rounded-xl p-3"
              >
                <p className="text-xs text-muted mb-2.5 font-medium flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> Pipeline
                </p>
                <div className="space-y-0.5">
                  <PipelineStage label="LLM analyze"  value={formatTime(decision.timing.total - decision.timing.execute)} icon={Brain}    delay={0.32} />
                  <PipelineStage label="Execute"      value={formatTime(decision.timing.execute)}                          icon={Server}   delay={0.34} />
                  <PipelineStage label="Total"        value={formatTime(decision.timing.total)}                            icon={Clock}    delay={0.36} />
                  <PipelineStage label="Cognee"       value={decision.cogneeOperation}                                     icon={Database} delay={0.38} />
                  <PipelineStage label="Redis"        value={decision.redisOperation}                                      icon={Server}   delay={0.40} />
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}