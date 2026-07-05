import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ReactFlow, Background, Controls,
  BackgroundVariant, MarkerType,
  type Node, type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion } from "framer-motion";
import { Brain, RefreshCw } from "lucide-react";
import { memoryApi } from "../../api";
import { MemoryNode } from "../../components/graph/MemoryNode";
import { NodeDrawer } from "../../components/graph/NodeDrawer";
import { Spinner } from "../../components/ui/Spinner";
import type { Memory, MemoryType } from "../../types";

const nodeTypes = { memoryNode: MemoryNode };

const CATEGORY_POSITIONS: Record<MemoryType, { x: number; y: number }> = {
  profile:    { x: 320, y: 60  },
  preference: { x: 320, y: 200 },
  knowledge:  { x: 320, y: 340 },
  experience: { x: 320, y: 480 },
};

const EDGE_COLORS: Record<MemoryType, string> = {
  profile:    "#a855f7",
  preference: "#06b6d4",
  knowledge:  "#f59e0b",
  experience: "#22c55e",
};

export default function Graph() {
  const [selectedType, setSelectedType] = useState<MemoryType | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["memories", "graph"],
    queryFn:  () => memoryApi.list({ limit: 100 }),
  });

  const memories: Memory[] = data?.data?.data?.memories ?? [];

  const counts = useMemo(() => ({
    profile:    memories.filter(m => m.type === "profile").length,
    preference: memories.filter(m => m.type === "preference").length,
    knowledge:  memories.filter(m => m.type === "knowledge").length,
    experience: memories.filter(m => m.type === "experience").length,
  }), [memories]);

  const handleNodeClick = useCallback((type: MemoryType) => {
    setSelectedType(prev => prev === type ? null : type);
  }, []);

  const nodes: Node[] = useMemo(() => [
    {
      id:       "user",
      type:     "memoryNode",
      position: { x: 100, y: 250 },
      data:     { label: "You", type: "user", count: memories.length },
      draggable: true,
    },
    ...( ["profile", "preference", "knowledge", "experience"] as MemoryType[]).map(type => ({
      id:       type,
      type:     "memoryNode",
      position: CATEGORY_POSITIONS[type],
      data: {
        label:   type.charAt(0).toUpperCase() + type.slice(1),
        type,
        count:   counts[type],
        onClick: () => handleNodeClick(type),
      },
      draggable: true,
    })),
  ], [memories.length, counts, handleNodeClick]);

  const edges: Edge[] = useMemo(() =>
    (["profile", "preference", "knowledge", "experience"] as MemoryType[]).map(type => ({
      id:             `user-${type}`,
      source:         "user",
      target:         type,
      animated:       counts[type] > 0,
      style:          { stroke: EDGE_COLORS[type], strokeWidth: counts[type] > 0 ? 2 : 1, opacity: counts[type] > 0 ? 0.8 : 0.3 },
      markerEnd:      { type: MarkerType.ArrowClosed, color: EDGE_COLORS[type] },
    })),
  [counts]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="w-6 h-6" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" /> Memory Graph
          </h1>
          <p className="text-muted text-sm mt-0.5">
            {memories.length} total memories across {Object.values(counts).filter(Boolean).length} categories
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted hover:text-white hover:bg-zinc-800 border border-border transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Graph */}
      <div className="flex-1 relative">
        {memories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <Brain className="w-14 h-14 text-zinc-700 mb-4" />
            <p className="text-white font-medium">No memories yet</p>
            <p className="text-muted text-sm mt-1">Start chatting to see your memory graph grow</p>
          </motion.div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            proOptions={{ hideAttribution: true }}
            colorMode="dark"
            style={{ background: "#09090B" }}
            minZoom={0.5}
            maxZoom={2}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1}
              color="#27272A"
            />
            <Controls
              style={{
                background: "#18181B",
                border: "1px solid #27272A",
                borderRadius: "12px",
              }}
            />
          </ReactFlow>
        )}
      </div>

      {/* Node drawer */}
      <NodeDrawer
        type={selectedType}
        memories={memories}
        onClose={() => setSelectedType(null)}
      />
    </div>
  );
}