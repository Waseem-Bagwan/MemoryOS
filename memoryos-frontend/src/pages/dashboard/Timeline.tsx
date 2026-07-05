import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Clock, CheckCircle2, RefreshCw, GitMerge,
  MinusCircle, XCircle, ChevronRight,
} from "lucide-react";
import { memoryApi } from "../../api";
import { formatDate, formatTime } from "../../lib/utils";
import { ExplainDrawer } from "../../components/drawer/ExplainDrawer";
import { Spinner } from "../../components/ui/Spinner";
import type { DecisionLog, DecisionAction } from "../../types";

const ACTION_CONFIG: Record<DecisionAction, {
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  dotColor: string;
}> = {
  STORE:  { icon: CheckCircle2, color: "text-success",   bg: "bg-success/10",   border: "border-success/25",   dotColor: "bg-success"   },
  UPDATE: { icon: RefreshCw,    color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/25", dotColor: "bg-secondary" },
  MERGE:  { icon: GitMerge,     color: "text-primary",   bg: "bg-primary/10",   border: "border-primary/25",   dotColor: "bg-primary"   },
  IGNORE: { icon: MinusCircle,  color: "text-muted",     bg: "bg-zinc-800/50",  border: "border-zinc-700/50",  dotColor: "bg-zinc-600"  },
  FORGET: { icon: XCircle,      color: "text-danger",    bg: "bg-danger/10",    border: "border-danger/25",    dotColor: "bg-danger"    },
};

export default function Timeline() {
  const [selected, setSelected] = useState<DecisionLog | null>(null);
  const [filter,   setFilter]   = useState<DecisionAction | "ALL">("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["decisions", "timeline"],
    queryFn:  () => memoryApi.decisions({ limit: 100 }),
  });

  const all      = data?.data?.data?.decisions ?? [];
  const filtered = filter === "ALL" ? all : all.filter(d => d.action === filter);

  if (isLoading) return <div className="flex items-center justify-center h-full"><Spinner className="w-6 h-6" /></div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" /> Decision Timeline
        </h1>
        <p className="text-muted text-sm mt-1">{all.length} decisions · click any to inspect</p>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {(["ALL", "STORE", "UPDATE", "MERGE", "IGNORE", "FORGET"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150 ${
              filter === f
                ? f === "ALL"
                  ? "bg-primary/15 text-white border-primary/30"
                  : `${ACTION_CONFIG[f as DecisionAction].bg} ${ACTION_CONFIG[f as DecisionAction].color} ${ACTION_CONFIG[f as DecisionAction].border}`
                : "bg-zinc-800/50 text-muted border-zinc-700/50 hover:text-white"
            }`}
          >
            {f} {f !== "ALL" && `(${all.filter(d => d.action === f).length})`}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Clock className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-muted">No {filter === "ALL" ? "" : filter + " "}decisions yet</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />
          <div className="space-y-3">
            {filtered.map((d, i) => {
              const config = ACTION_CONFIG[d.action as DecisionAction];
              const Icon   = config.icon;
              return (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.035 }}
                  className="flex gap-4"
                >
                  {/* Dot */}
                  <div className={`relative z-10 w-10 h-10 rounded-xl border-2 flex items-center justify-center flex-shrink-0 ${config.bg} ${config.border}`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>

                  {/* Card */}
                  <motion.div
                    whileHover={{ x: 2 }}
                    onClick={() => setSelected(d)}
                    className="flex-1 bg-surface border border-border rounded-xl p-4 mb-1 cursor-pointer hover:border-zinc-600 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className={`text-xs font-bold font-mono ${config.color}`}>{d.action}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted">{formatDate(d.createdAt)}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>

                    <p className="text-sm text-zinc-200 mb-1.5 line-clamp-1">"{d.inputText}"</p>
                    <p className="text-xs text-muted line-clamp-2">{d.reasoning}</p>

                    <div className="flex items-center gap-3 mt-2.5">
                      <span className="text-xs text-zinc-600 font-mono">{formatTime(d.totalLatencyMs)}</span>
                      {d.importance > 0 && (
                        <span className="text-xs text-zinc-600">importance: {d.importance}</span>
                      )}
                      {d.conflictDetected && (
                        <span className="text-xs text-warning flex items-center gap-1">
                          ⚡ conflict resolved
                        </span>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <ExplainDrawer log={selected} onClose={() => setSelected(null)} />
    </div>
  );
}