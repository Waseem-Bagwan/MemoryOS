import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DecisionAction } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(dateStr));
}

export function getActionColor(action: DecisionAction): string {
  const map: Record<DecisionAction, string> = {
    STORE:  "text-success",
    UPDATE: "text-secondary",
    MERGE:  "text-primary",
    IGNORE: "text-muted",
    FORGET: "text-danger",
  };
  return map[action];
}

export function getActionBg(action: DecisionAction): string {
  const map: Record<DecisionAction, string> = {
    STORE:  "bg-success/10 border-success/20",
    UPDATE: "bg-secondary/10 border-secondary/20",
    MERGE:  "bg-primary/10 border-primary/20",
    IGNORE: "bg-muted/10 border-muted/20",
    FORGET: "bg-danger/10 border-danger/20",
  };
  return map[action];
}

export function getTypeColor(type: string): string {
  const map: Record<string, string> = {
    profile:    "bg-purple-500/10 text-purple-400 border-purple-500/20",
    preference: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    knowledge:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
    experience: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  return map[type] ?? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
}

export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}