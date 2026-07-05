// ─────────────────────────────────────────────────────────────
// pipeline/index.ts
// The pipeline orchestrator — runs all stages in order.
//
// This is the entry point the service layer calls.
// It coordinates:
//   1. Fetch existing memories from Postgres
//   2. Run LLM analysis (classify + score + detect conflict)
//   3. Execute decision (write to Cognee + Postgres + Redis)
//   4. Log the decision to DecisionLog table
//   5. Return the full result
// ─────────────────────────────────────────────────────────────
import { prisma } from "../config/prisma";
import { IngestEvent, IngestResponse, PipelineContext } from "../types";
import { runAnalysis } from "./analyze";
import { executeDecision } from "./decide";
import { DecisionAction, MemoryType } from "@prisma/client";

export async function runPipeline(
  userId: string,
  event: IngestEvent
): Promise<IngestResponse> {
  const pipelineStart = Date.now();

  // ─────────────────────────────────────────
  // Step 1: Build context
  // Fetch existing memories so the LLM can
  // compare against them for conflict detection.
  // ─────────────────────────────────────────
  const existingMemories = await prisma.memory.findMany({
    where: {
      userId,
      lifecycle: "active", // only look at active memories
    },
    select: {
      id: true,
      content: true,
      type: true,
      importance: true,
      lifecycle: true,
      tags: true,
      createdAt: true,
      lastAccessedAt: true,
    },
    orderBy: { importance: "desc" },
    take: 20, // send top 20 by importance to the LLM
              // sending all memories would blow the context window
  });

  const context: PipelineContext = {
    userId,
    sessionId: event.sessionId,
    inputText: event.content,
    existingMemories,
    timing: {},
  };

  // ─────────────────────────────────────────
  // Step 2: Analyze — the LLM decides
  // ─────────────────────────────────────────
  const analysis = await runAnalysis(context);

  // ─────────────────────────────────────────
  // Step 3: Execute — write to backends
  // ─────────────────────────────────────────
  const { decision, memoryId, cogneeId } = await executeDecision(
    context,
    analysis
  );

  // ─────────────────────────────────────────
  // Step 4: Log the decision
  // Every decision gets logged. This is the
  // explainability layer that makes MemoryOS
  // unique. Developers can always audit why
  // a memory was stored or rejected.
  // ─────────────────────────────────────────
  const totalLatency = Date.now() - pipelineStart;

  await prisma.decisionLog.create({
    data: {
      userId,
      sessionId: event.sessionId,
      memoryId: memoryId,
      inputText: event.content,
      action: analysis.action as DecisionAction,
      reasoning: analysis.reasoning,
      llmResponse: analysis as object,
      pipelineTiming: context.timing as object,
      totalLatencyMs: totalLatency,
      importance: analysis.importance,
      conflictDetected: analysis.conflictWithId !== null,
      conflictWithId: analysis.conflictWithId ?? null,
    },
  });

  // ─────────────────────────────────────────
  // Step 5: Return the full result
  // ─────────────────────────────────────────
  const sessionId = event.sessionId ?? `auto-${Date.now()}`;

  return {
    success: true,
    decision: {
      ...decision,
      timing: {
        ...decision.timing,
        total: totalLatency,
      },
    },
    memoryId,
    cogneeId,
    sessionId,
  };
}