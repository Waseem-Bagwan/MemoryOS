// ─────────────────────────────────────────────────────────────
// MemoryOS – Core Types
// All the shapes that flow through the system.
// ─────────────────────────────────────────────────────────────

// Memory type and lifecycle are used as plain strings throughout
// (Prisma enums are only needed after `prisma generate` runs,
// so we avoid importing them to keep the codebase simpler)
export type MemoryTypeValue = "profile" | "preference" | "knowledge" | "experience";
export type LifecycleStateValue = "candidate" | "active" | "archived" | "forgotten";
export type DecisionActionValue = "STORE" | "UPDATE" | "MERGE" | "IGNORE" | "FORGET";

// ─────────────────────────────────────────
// INGEST EVENT
// What the developer sends to MemoryOS.
// They don't send a "memory" — they send
// an "event". MemoryOS decides the rest.
// ─────────────────────────────────────────
export interface IngestEvent {
  content: string;       // the raw text to analyze
  sessionId?: string;    // optional: which conversation session
  metadata?: Record<string, unknown>; // anything extra the dev wants to pass
}

// ─────────────────────────────────────────
// PIPELINE CONTEXT
// Everything the pipeline stages need to
// make smart decisions. Passed through
// every stage like a baton.
// ─────────────────────────────────────────
export interface PipelineContext {
  userId: string;
  sessionId?: string;
  inputText: string;

  // Populated by ClassifyStage
  memoryType?: string;

  // Populated by ScoreStage
  importance?: number;

  // Populated by ConflictStage
  conflictDetected?: boolean;
  conflictingMemoryId?: string;
  conflictingMemoryContent?: string;

  // The full existing memories for this user
  // fetched once at pipeline start, shared across stages
  existingMemories?: ExistingMemory[];

  // Timing — each stage records how long it took
  timing: Record<string, number>;
}

// ─────────────────────────────────────────
// EXISTING MEMORY
// A lightweight version of the Memory record
// used inside the pipeline for comparisons.
// We don't need every field — just enough
// to detect conflicts and score importance.
// ─────────────────────────────────────────
export interface ExistingMemory {
  id: string;
  content: string;
  type: string;
  importance: number;
  lifecycle: string;
  tags: string[];
  createdAt: Date;
  lastAccessedAt: Date;
}

// ─────────────────────────────────────────
// PIPELINE STAGE RESULT
// What each stage returns.
// ─────────────────────────────────────────
export interface StageResult {
  stageName: string;
  success: boolean;
  durationMs: number;
  output: Record<string, unknown>;
  error?: string;
}

// ─────────────────────────────────────────
// MEMORY DECISION
// The final output of the full pipeline.
// This is what gets returned to the developer
// and what gets logged in DecisionLog.
// ─────────────────────────────────────────
export interface MemoryDecision {
  action: "STORE" | "UPDATE" | "MERGE" | "IGNORE" | "FORGET";
  reasoning: string;
  confidence: number;
  importance: number;
  memoryType: string;
  distilledContent: string;      // what actually got stored (clean fact)
  conflictDetected: boolean;
  conflictWithId?: string;
  tags: string[];

  // What actually happened in the backend
  cogneeOperation?: string;    // e.g. "remember() called", "forget() + remember()"
  redisOperation?: string;     // e.g. "session cache updated"

  // Full pipeline timing breakdown
  timing: {
    classify: number;
    score: number;
    conflict: number;
    decide: number;
    execute: number;
    total: number;
  };
}

// ─────────────────────────────────────────
// INGEST RESPONSE
// What the /api/memory/ingest endpoint returns.
// This is what the frontend displays in
// the Memory Decision Panel.
// ─────────────────────────────────────────
export interface IngestResponse {
  success: boolean;
  decision: MemoryDecision;
  memoryId?: string;           // Postgres ID (if stored/updated)
  cogneeId?: string;           // Cognee ID (if stored/updated)
  sessionId: string;
}

// ─────────────────────────────────────────
// LLM ANALYSIS RESULT
// The structured JSON we ask Claude to return.
// Used by the pipeline stages internally.
// ─────────────────────────────────────────
export interface LLMAnalysisResult {
  memoryType: "profile" | "preference" | "knowledge" | "experience";
  action: "STORE" | "UPDATE" | "MERGE" | "IGNORE" | "FORGET";
  importance: number;
  confidence: number;
  distilledContent: string;      // clean third-person fact to store
  conflictWithId: string | null;
  reasoning: string;
  tags: string[];
}

// ─────────────────────────────────────────
// AUTH TYPES
// ─────────────────────────────────────────
export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Express.Request {
  user?: JWTPayload;
}

// ─────────────────────────────────────────
// API RESPONSE WRAPPER
// Every endpoint returns this shape.
// Consistent = easier to handle on frontend.
// ─────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}