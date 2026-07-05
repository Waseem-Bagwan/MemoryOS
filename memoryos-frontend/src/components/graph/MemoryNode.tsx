import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";
import { User, Heart, BookOpen, Star } from "lucide-react";

export type NodeType = "user" | "profile" | "preference" | "knowledge" | "experience";

interface MemoryNodeData {
  label: string;
  type: NodeType;
  count: number;
  onClick?: () => void;
}

const NODE_CONFIG: Record<NodeType, {
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  glow: string;
}> = {
  user:       { icon: User,     color: "text-white",      bg: "bg-primary/20",   border: "border-primary/50",   glow: "shadow-[0_0_20px_rgba(124,58,237,0.3)]"  },
  profile:    { icon: User,     color: "text-purple-400", bg: "bg-purple-500/15", border: "border-purple-500/40", glow: "shadow-[0_0_12px_rgba(168,85,247,0.2)]"  },
  preference: { icon: Heart,    color: "text-cyan-400",   bg: "bg-cyan-500/15",  border: "border-cyan-500/40",  glow: "shadow-[0_0_12px_rgba(6,182,212,0.2)]"   },
  knowledge:  { icon: BookOpen, color: "text-amber-400",  bg: "bg-amber-500/15", border: "border-amber-500/40", glow: "shadow-[0_0_12px_rgba(245,158,11,0.2)]"  },
  experience: { icon: Star,     color: "text-emerald-400",bg: "bg-emerald-500/15",border:"border-emerald-500/40",glow: "shadow-[0_0_12px_rgba(34,197,94,0.2)]"   },
};

export const MemoryNode = memo(function MemoryNode({
  data,
}: {
  data: MemoryNodeData;
}) {
  const config = NODE_CONFIG[data.type];
  const Icon   = config.icon;
  const isUser = data.type === "user";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      onClick={data.onClick}
      className={`
        ${isUser ? "w-20 h-20 rounded-2xl" : "w-36 rounded-xl"}
        flex flex-col items-center justify-center gap-1.5
        ${config.bg} border ${config.border} ${config.glow}
        cursor-pointer select-none transition-shadow duration-200
        p-3
      `}
    >
      {!isUser && <Handle type="target" position={Position.Left}  style={{ opacity: 0 }} />}

      <div className={`${isUser ? "w-10 h-10" : "w-7 h-7"} rounded-lg flex items-center justify-center ${config.bg} border ${config.border}`}>
        <Icon className={`${isUser ? "w-5 h-5" : "w-3.5 h-3.5"} ${config.color}`} />
      </div>

      <p className={`${isUser ? "text-sm" : "text-xs"} font-semibold text-white text-center leading-tight`}>
        {data.label}
      </p>

      {!isUser && data.count > 0 && (
        <span className={`text-xs font-mono ${config.color} opacity-80`}>
          {data.count} {data.count === 1 ? "memory" : "memories"}
        </span>
      )}

      {!isUser && <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />}
      {isUser  && <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />}
    </motion.div>
  );
});