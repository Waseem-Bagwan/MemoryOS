import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MessageSquare, Brain, Clock, LayoutDashboard,
  LogOut, Cpu, GitBranch,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../store/auth";
import { useQuery } from "@tanstack/react-query";
import { memoryApi } from "../../api";

const navItems = [
  { to: "/",         icon: LayoutDashboard, label: "Dashboard" },
  { to: "/chat",     icon: MessageSquare,   label: "Chat"      },
  { to: "/memories", icon: Brain,           label: "Memories", badge: true },
  { to: "/timeline", icon: Clock,           label: "Timeline"  },
  { to: "/graph",    icon: GitBranch,       label: "Graph"     },
];

export function Sidebar() {
  const { logout, user } = useAuthStore();

  const { data } = useQuery({
    queryKey: ["memories", "count"],
    queryFn:  () => memoryApi.list({ limit: 1 }),
    refetchInterval: 15_000,
  });

  // We can't get total count from limit:1, so just show active badge if any
  const hasMemories = (data?.data?.data?.count ?? 0) > 0;

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-56 h-screen flex flex-col bg-surface border-r border-border fixed left-0 top-0 z-40"
    >
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">MemoryOS</p>
            <p className="text-xs text-muted">Memory Engine</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink key={to} to={to} end={to === "/"}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 2 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer",
                  isActive
                    ? "bg-primary/15 text-white border border-primary/20"
                    : "text-muted hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-primary" : "")} />
                <span className="flex-1">{label}</span>
                {badge && hasMemories && (
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                )}
                {isActive && (
                  <motion.div layoutId="active-dot" className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1">
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-primary">
              {user?.name?.[0]?.toUpperCase() ?? user?.email[0]?.toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.name ?? user?.email}</p>
            <p className="text-xs text-muted truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted hover:text-danger hover:bg-danger/5 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </motion.aside>
  );
}