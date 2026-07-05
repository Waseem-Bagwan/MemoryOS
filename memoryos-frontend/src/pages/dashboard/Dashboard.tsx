import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Brain, MessageSquare, Clock, Zap, TrendingUp, Database } from "lucide-react";
import { memoryApi } from "../../api";
import { useAuthStore } from "../../store/auth";
import { Spinner } from "../../components/ui/Spinner";
import { formatTime } from "../../lib/utils";

function StatCard({
  icon: Icon, label, value, sub, color, delay
}: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="bg-surface border border-border rounded-2xl p-5 hover:border-zinc-600 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-white">{value}</p>
      <p className="text-sm text-muted mt-0.5">{label}</p>
      {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();

  const { data: memoriesData, isLoading: memoriesLoading } = useQuery({
    queryKey: ["memories"],
    queryFn: () => memoryApi.list({ limit: 100 }),
  });

  const { data: decisionsData, isLoading: decisionsLoading } = useQuery({
    queryKey: ["decisions"],
    queryFn: () => memoryApi.decisions({ limit: 100 }),
  });

  const memories  = memoriesData?.data?.data?.memories  ?? [];
  const decisions = decisionsData?.data?.data?.decisions ?? [];

  const avgLatency = decisions.length > 0
    ? Math.round(decisions.reduce((s, d) => s + d.totalLatencyMs, 0) / decisions.length)
    : 0;

  const stored  = decisions.filter(d => d.action === "STORE").length;
  const updated = decisions.filter(d => d.action === "UPDATE").length;
  const ignored = decisions.filter(d => d.action === "IGNORE").length;

  const isLoading = memoriesLoading || decisionsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="w-6 h-6" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-semibold text-white">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},
          {" "}{user?.name ?? "there"} 👋
        </h1>
        <p className="text-muted text-sm mt-1">
          Here's what MemoryOS knows and has decided so far.
        </p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Brain}        label="Active memories"    value={memories.length}  color="bg-primary/15 text-primary"   delay={0}    />
        <StatCard icon={MessageSquare} label="Total decisions"   value={decisions.length} color="bg-secondary/15 text-secondary" delay={0.05} />
        <StatCard icon={TrendingUp}   label="Memories stored"   value={stored}           color="bg-success/15 text-success"   delay={0.1}  />
        <StatCard icon={Zap}          label="Updates made"      value={updated}          color="bg-warning/15 text-warning"   delay={0.15} />
        <StatCard icon={Clock}        label="Avg latency"       value={formatTime(avgLatency)} color="bg-zinc-700/50 text-zinc-300" delay={0.2} />
        <StatCard icon={Database}     label="Ignored (noise)"   value={ignored}          color="bg-danger/15 text-danger"     delay={0.25} />
      </div>

      {/* Recent decisions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-surface border border-border rounded-2xl p-5"
      >
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted" />
          Recent decisions
        </h2>
        {decisions.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
            <p className="text-muted text-sm">No decisions yet.</p>
            <p className="text-zinc-600 text-xs mt-1">Start chatting to see memory decisions here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {decisions.slice(0, 6).map((d) => (
              <div key={d.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                <span className={`text-xs font-mono font-medium w-14 ${
                  d.action === "STORE"  ? "text-success"   :
                  d.action === "UPDATE" ? "text-secondary" :
                  d.action === "MERGE"  ? "text-primary"   :
                  d.action === "FORGET" ? "text-danger"    : "text-muted"
                }`}>{d.action}</span>
                <span className="text-sm text-zinc-300 flex-1 truncate">{d.inputText}</span>
                <span className="text-xs text-muted font-mono">{formatTime(d.totalLatencyMs)}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}