import { api } from "./client";
import type {
  AuthResponse, Memory, DecisionLog,
  ChatResponse, AgentContext, ApiResponse, MemoryDecision
} from "../types";

// ─── Auth ─────────────────────────────────────────────────────
export const authApi = {
  register: (email: string, password: string, name?: string) =>
    api.post<ApiResponse<AuthResponse>>("/auth/register", { email, password, name }),

  login: (email: string, password: string) =>
    api.post<ApiResponse<AuthResponse>>("/auth/login", { email, password }),
};

// ─── Chat ─────────────────────────────────────────────────────
export const chatApi = {
  sendMessage: (message: string, sessionId: string) =>
    api.post<ApiResponse<ChatResponse>>("/chat/message", { message, sessionId }),
};

// ─── Memory ───────────────────────────────────────────────────
export const memoryApi = {
  list: (filters?: { type?: string; lifecycle?: string; limit?: number }) =>
    api.get<ApiResponse<{ memories: Memory[]; count: number }>>("/memory", { params: filters }),

  ingest: (content: string, sessionId?: string) =>
    api.post<ApiResponse<{ decision: MemoryDecision; memoryId?: string; sessionId: string }>>(
      "/memory/ingest", { content, sessionId }
    ),

  decisions: (filters?: { sessionId?: string; limit?: number }) =>
    api.get<ApiResponse<{ decisions: DecisionLog[]; count: number }>>(
      "/memory/decisions", { params: filters }
    ),

  agentContext: (query: string) =>
    api.post<ApiResponse<AgentContext>>("/memory/agent-context", { query }),

  recall: (query: string, limit?: number) =>
    api.post<ApiResponse<{ memories: unknown[]; count: number }>>(
      "/memory/recall", { query, limit }
    ),
};