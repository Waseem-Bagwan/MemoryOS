import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Brain, Search, Layers } from "lucide-react";
import { memoryApi } from "../../api";
import { getTypeColor, formatDate } from "../../lib/utils";
import { Spinner } from "../../components/ui/Spinner";
import type { Memory, MemoryType } from "../../types";

const TYPE_FILTERS: Array<{ value: MemoryType | "all"; label: string }> = [
  { value: "all",        label: "All"        },
  { value: "profile",    label: "Profile"    },
  { value: "preference", label: "Preferences"},
  { value: "knowledge",  label: "Knowledge"  },
  { value: "experience", label: "Experience" },
];

function ImportanceBar({ value }: { value: number }) {
  const color = value >= 0.7 ? "bg-success" : value >= 0.4 ? "bg-warning" : "bg-muted";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value * 100}%` }} />
      </div>
      <span className="text-xs font-mono text-muted">{(value * 100).toFixed(0)}%</span>
    </div>
  );
}

function MemoryCard({ m, i }: { m: Memory; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
      className="bg-surface border border-border rounded-xl p-4 hover:border-zinc-600 transition-all group"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-sm text-white font-medium leading-snug flex-1">{m.content}</p>
        <span className={`text-xs px-2 py-0.5 rounded-lg border font-medium flex-shrink-0 ${getTypeColor(m.type)}`}>
          {m.type}
        </span>
      </div>

      {/* Importance */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted flex items-center gap-1">
            <Layers className="w-3 h-3" /> Importance
          </span>
        </div>
        <ImportanceBar value={m.importance} />
      </div>

      {/* Tags */}
      {m.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {m.tags.map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${
          m.lifecycle === "active"   ? "bg-success/10 text-success border-success/20"   :
          m.lifecycle === "archived" ? "bg-warning/10 text-warning border-warning/20"   :
                                       "bg-danger/10 text-danger border-danger/20"
        }`}>
          {m.lifecycle}
        </span>
        <span className="text-xs text-zinc-600">{formatDate(m.createdAt)}</span>
      </div>
    </motion.div>
  );
}

export default function Memories() {
  const [filter, setFilter] = useState<MemoryType | "all">("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["memories", "page"],
    queryFn:  () => memoryApi.list({ limit: 100 }),
  });

  const all = data?.data?.data?.memories ?? [];

  const visible = all.filter(m => {
    const matchesType   = filter === "all" || m.type === filter;
    const matchesSearch = !search || m.content.toLowerCase().includes(search.toLowerCase())
                       || m.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  if (isLoading) return <div className="flex items-center justify-center h-full"><Spinner className="w-6 h-6" /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" /> Memory Store
        </h1>
        <p className="text-muted text-sm mt-1">{all.length} active memories</p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search memories or tags..."
            className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-muted/50 focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                filter === f.value
                  ? "bg-primary/15 text-white border-primary/30"
                  : "bg-zinc-800/50 text-muted border-zinc-700/50 hover:text-white"
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-zinc-600">
                ({f.value === "all" ? all.length : all.filter(m => m.type === f.value).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="text-center py-20">
          <Brain className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-muted">
            {search ? `No memories match "${search}"` : "No memories yet. Start chatting!"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((m, i) => <MemoryCard key={m.id} m={m} i={i} />)}
        </div>
      )}
    </div>
  );
}