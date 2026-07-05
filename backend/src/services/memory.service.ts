// ─────────────────────────────────────────────────────────────
// services/memory.service.ts
// The memory service — sits between the controller and the
// pipeline. Handles session management, the lock, and
// surfaces query APIs (get memories, get decision log).
// ─────────────────────────────────────────────────────────────
import { prisma } from "../config/prisma";
import { redisAdapter } from "../adapters/redis.adapter";
import { cogneeAdapter } from "../adapters/cognee.adapter";
import { runPipeline } from "../pipeline";
import { AppError } from "../middleware/errorhandle";
import { IngestEvent, IngestResponse } from "../types";

export const memoryService = {
  // ─────────────────────────────────────────
  // INGEST
  // The main entry point for processing a
  // new piece of information.
  // ─────────────────────────────────────────
  async ingest(userId: string, event: IngestEvent): Promise<IngestResponse> {
    const locked = await redisAdapter.acquireLock(userId);
    if (!locked) {
      throw new AppError(
        "Another memory operation is in progress. Please wait a moment and try again.",
        429
      );
    }

    try {
      // Ensure the session exists in Postgres
      if (event.sessionId) {
        await prisma.session.upsert({
          where: { id: event.sessionId },
          create: { id: event.sessionId, userId },
          update: { messageCount: { increment: 1 } },
        });
      }

      // Add message to Redis session cache
      if (event.sessionId) {
        await redisAdapter.addSessionMessage(
          event.sessionId,
          "user",
          event.content
        );
      }

      // Run the full MemoryOS pipeline
      const result = await runPipeline(userId, event);
      return result;
    } finally {
      // Always release the lock, even if pipeline throws
      await redisAdapter.releaseLock(userId);
    }
  },

  // ─────────────────────────────────────────
  // RECALL
  // Retrieve relevant memories for a query.
  // Used when you want to give context to an LLM.
  // ─────────────────────────────────────────
  async recall(userId: string, query: string, limit: number = 10) {
    // Search Cognee for semantically relevant memories
    const cogneeResults = await cogneeAdapter.recall(query, userId, limit);

    // Enrich with Postgres metadata
    const enriched = await Promise.all(
      cogneeResults.map(async (r) => {
        const meta = await prisma.memory.findFirst({
          where: { cogneeId: r.id, userId },
          select: { id: true, type: true, importance: true, tags: true, createdAt: true },
        });

        // Update last accessed timestamp (strengthening signal)
        if (meta) {
          await prisma.memory.update({
            where: { id: meta.id },
            data: { lastAccessedAt: new Date() },
          });
        }

        return { ...r, metadata: meta };
      })
    );

    return enriched;
  },

  // ─────────────────────────────────────────
  // GET USER MEMORIES
  // List all memories for a user (with filters).
  // ─────────────────────────────────────────
  async getUserMemories(
    userId: string,
    filters: {
      type?: string;
      lifecycle?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    return prisma.memory.findMany({
      where: {
        userId,
        ...(filters.type && { type: filters.type as never }),
        ...(filters.lifecycle
          ? { lifecycle: filters.lifecycle as never }
          : { lifecycle: "active" }), // default to active only
      },
      orderBy: { importance: "desc" },
      take: filters.limit ?? 20,
      skip: filters.offset ?? 0,
      select: {
        id: true,
        content: true,
        type: true,
        lifecycle: true,
        importance: true,
        tags: true,
        createdAt: true,
        lastAccessedAt: true,
        replacesId: true,
      },
    });
  },

  // ─────────────────────────────────────────
  // GET DECISION LOG
  // Return the full audit trail of decisions.
  // This is the explainability feature.
  // ─────────────────────────────────────────
  async getDecisionLog(
    userId: string,
    filters: { sessionId?: string; limit?: number; offset?: number } = {}
  ) {
    return prisma.decisionLog.findMany({
      where: {
        userId,
        ...(filters.sessionId && { sessionId: filters.sessionId }),
      },
      orderBy: { createdAt: "desc" },
      take: filters.limit ?? 20,
      skip: filters.offset ?? 0,
      select: {
        id: true,
        inputText: true,
        action: true,
        reasoning: true,
        importance: true,
        conflictDetected: true,
        conflictWithId: true,
        totalLatencyMs: true,
        pipelineTiming: true,
        createdAt: true,
        memoryId: true,
      },
    });
  },

  // ─────────────────────────────────────────
  // BUILD AGENT CONTEXT
  // Called by the chat agent before generating
  // a response. Returns memories as a formatted
  // string the LLM can use in its system prompt.
  // ─────────────────────────────────────────
  async buildAgentContext(
    userId: string,
    query: string,
    maxTokens: number = 1500
  ): Promise<{ contextString: string; memoriesUsed: number; totalMemories: number }> {
    // Get top memories by importance from Redis (fast path)
    const topIds = await redisAdapter.getTopMemoryIds(userId, 15);

    // Also search Cognee for query-relevant memories
    const cogneeResults = await cogneeAdapter.recall(query, userId, 10);
    const cogneeIds = cogneeResults.map((r) => r.id);

    // Combine + deduplicate
    const allIds = [...new Set([...topIds, ...cogneeIds])];

    // Fetch from Postgres
    const memories = allIds.length > 0
      ? await prisma.memory.findMany({
          where: { userId, lifecycle: "active", id: { in: allIds } },
          select: { content: true, type: true, importance: true },
          orderBy: { importance: "desc" },
        })
      : await prisma.memory.findMany({
          where: { userId, lifecycle: "active" },
          orderBy: { importance: "desc" },
          take: 10,
          select: { content: true, type: true, importance: true },
        });

    // Group by type for cleaner LLM context
    const grouped: Record<string, string[]> = {};
    for (const m of memories) {
      if (!grouped[m.type]) grouped[m.type] = [];
      grouped[m.type].push(m.content);
    }

    let contextString = "## What I know about you:\n\n";
    for (const [type, contents] of Object.entries(grouped)) {
      contextString += `**${type.charAt(0).toUpperCase() + type.slice(1)}:**\n`;
      contextString += contents.map((c) => `- ${c}`).join("\n");
      contextString += "\n\n";
    }

    // Trim to token budget (rough: 1 token ≈ 4 chars)
    if (contextString.length > maxTokens * 4) {
      contextString = contextString.substring(0, maxTokens * 4) + "\n...";
    }

    return {
      contextString,
      memoriesUsed: memories.length,
      totalMemories: await prisma.memory.count({
        where: { userId, lifecycle: "active" },
      }),
    };
  },

  // ─────────────────────────────────────────
  // GET SESSION CONTEXT
  // Returns the hot session messages from Redis
  // + top memories for the user.
  // Used to build LLM context efficiently.
  // ─────────────────────────────────────────
  async getSessionContext(userId: string, sessionId: string) {
    const [sessionMessages, topMemoryIds] = await Promise.all([
      redisAdapter.getSessionMessages(sessionId),
      redisAdapter.getTopMemoryIds(userId, 10),
    ]);

    // Fetch the actual memory content from Postgres for the top IDs
    const topMemories =
      topMemoryIds.length > 0
        ? await prisma.memory.findMany({
            where: { id: { in: topMemoryIds }, userId },
            select: { id: true, content: true, type: true, importance: true },
          })
        : [];

    return { sessionMessages, topMemories };
  },
};