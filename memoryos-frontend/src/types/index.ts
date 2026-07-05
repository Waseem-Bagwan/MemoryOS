// ─── Auth ────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ─── Memory ──────────────────────────────────────────────────
export type MemoryType = "profile" | "preference" | "knowledge" | "experience";
export type LifecycleState = "active" | "archived" | "forgotten" | "candidate";
export type DecisionAction = "STORE" | "UPDATE" | "MERGE" | "IGNORE" | "FORGET";

export interface Memory {
  id: string;
  content: string;
  type: MemoryType;
  lifecycle: LifecycleState;
  importance: number;
  tags: string[];
  createdAt: string;
  lastAccessedAt: string;
  replacesId: string | null;
}

// ─── Decision ────────────────────────────────────────────────
export interface MemoryDecision {
  action: DecisionAction;
  reasoning: string;
  confidence: number;
  importance: number;
  memoryType: MemoryType;
  distilledContent: string;
  conflictDetected: boolean;
  conflictWithId?: string;
  tags: string[];
  cogneeOperation: string;
  redisOperation: string;
  timing: {
    classify: number;
    score: number;
    conflict: number;
    decide: number;
    execute: number;
    total: number;
  };
}

export interface DecisionLog {
  id: string;
  inputText: string;
  action: DecisionAction;
  reasoning: string;
  importance: number;
  conflictDetected: boolean;
  conflictWithId: string | null;
  totalLatencyMs: number;
  pipelineTiming: { analyze: number; execute: number };
  createdAt: string;
  memoryId: string | null;
}

// ─── Chat ────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  decision?: MemoryDecision;      // only on user messages (after ingest)
  memoriesUsed?: number;
  memoryContext?: string;
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
  memoriesUsed: number;
  memoryContext: string;
}

// ─── Agent Context ───────────────────────────────────────────
export interface AgentContext {
  contextString: string;
  memoriesUsed: number;
  totalMemories: number;
}

// ─── API wrapper ─────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}