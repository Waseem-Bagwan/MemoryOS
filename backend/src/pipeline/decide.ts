// ─────────────────────────────────────────────────────────────
// pipeline/decide.ts
// Stage 2: DECIDE + EXECUTE
// ─────────────────────────────────────────────────────────────
import { prisma } from "../config/prisma";
import { LLMAnalysisResult, MemoryDecision, PipelineContext } from "../types";
import { cogneeAdapter } from "../adapters/cognee.adapter";
import { redisAdapter } from "../adapters/redis.adapter";

export async function executeDecision(
  context: PipelineContext,
  analysis: LLMAnalysisResult
): Promise<{ decision: MemoryDecision; memoryId?: string; cogneeId?: string }> {
  const start = Date.now();

  let memoryId: string | undefined;
  let cogneeId: string | undefined;
  let cogneeOperation = "none";
  let redisOperation = "none";

  switch (analysis.action) {
    case "STORE": {
      const cId = await cogneeAdapter.remember(
        analysis.distilledContent || context.inputText,
        context.userId
      );
      cogneeOperation = "cognee.add() + cognee.cognify() called";

      const memory = await prisma.memory.create({
        data: {
          userId:     context.userId,
          sessionId:  context.sessionId,
          cogneeId:   cId,
          content:    analysis.distilledContent || context.inputText,
          type:       analysis.memoryType as "profile" | "preference" | "knowledge" | "experience",
          lifecycle:  "active",
          importance: analysis.importance,
          tags:       analysis.tags,
        },
      });
      memoryId = memory.id;

      await redisAdapter.addToMemoryIndex(context.userId, memory.id, analysis.importance);
      redisOperation = "added to importance index";
      break;
    }

    case "UPDATE": {
      if (analysis.conflictWithId) {
        // Archive the old memory
        await prisma.memory.update({
          where: { id: analysis.conflictWithId },
          data:  { lifecycle: "archived" },
        });

        // Tell Cognee to forget the old one
        const oldMemory = await prisma.memory.findUnique({
          where:  { id: analysis.conflictWithId },
          select: { cogneeId: true },
        });
        if (oldMemory?.cogneeId) {
          await cogneeAdapter.forget(oldMemory.cogneeId, context.userId);
        }
      }

      // Store the new distilled memory
      const cId = await cogneeAdapter.remember(
        analysis.distilledContent || context.inputText,
        context.userId
      );
      cogneeOperation = "cognee.forget(old) + cognee.add() + cognee.cognify()";

      const memory = await prisma.memory.create({
        data: {
          userId:     context.userId,
          sessionId:  context.sessionId,
          cogneeId:   cId,
          content:    analysis.distilledContent || context.inputText,
          type:       analysis.memoryType as "profile" | "preference" | "knowledge" | "experience",
          lifecycle:  "active",
          importance: analysis.importance,
          tags:       analysis.tags,
          replacesId: analysis.conflictWithId ?? undefined,
        },
      });

      if (analysis.conflictWithId) {
        await prisma.memory.update({
          where: { id: analysis.conflictWithId },
          data:  { replacedById: memory.id },
        });
      }

      memoryId = memory.id;
      await redisAdapter.addToMemoryIndex(context.userId, memory.id, analysis.importance);
      redisOperation = "importance index updated";
      break;
    }

    case "MERGE": {
      const cId = await cogneeAdapter.remember(
        analysis.distilledContent || context.inputText,
        context.userId
      );
      cogneeOperation = "cognee.add() + cognee.cognify() for merge";

      const memory = await prisma.memory.create({
        data: {
          userId:     context.userId,
          sessionId:  context.sessionId,
          cogneeId:   cId,
          content:    analysis.distilledContent || context.inputText,
          type:       analysis.memoryType as "profile" | "preference" | "knowledge" | "experience",
          lifecycle:  "active",
          importance: analysis.importance,
          tags:       analysis.tags,
        },
      });
      memoryId = memory.id;
      redisOperation = "session cache refreshed";
      break;
    }

    case "IGNORE": {
      cogneeOperation = "no operation — memory ignored";
      redisOperation  = "no operation";
      break;
    }

    case "FORGET": {
      if (analysis.conflictWithId) {
        const toForget = await prisma.memory.findUnique({
          where:  { id: analysis.conflictWithId },
          select: { cogneeId: true },
        });

        if (toForget?.cogneeId) {
          await cogneeAdapter.forget(toForget.cogneeId, context.userId);
        }

        await prisma.memory.update({
          where: { id: analysis.conflictWithId },
          data:  { lifecycle: "forgotten" },
        });

        await redisAdapter.removeFromMemoryIndex(context.userId, analysis.conflictWithId);
        cogneeOperation = "cognee.forget() called";
        redisOperation  = "removed from importance index";
      }
      break;
    }
  }

  const executeTime = Date.now() - start;
  context.timing["execute"] = executeTime;

  const totalTime = Object.values(context.timing).reduce((sum, t) => sum + t, 0);

  const decision: MemoryDecision = {
    action:           analysis.action,
    reasoning:        analysis.reasoning,
    confidence:       analysis.confidence,
    importance:       analysis.importance,
    memoryType:       analysis.memoryType,
    distilledContent: analysis.distilledContent || context.inputText,
    conflictDetected: analysis.conflictWithId !== null,
    conflictWithId:   analysis.conflictWithId ?? undefined,
    tags:             analysis.tags,
    cogneeOperation,
    redisOperation,
    timing: {
      classify: 0,
      score:    0,
      conflict: 0,
      decide:   0,
      execute:  executeTime,
      total:    totalTime,
    },
  };

  return { decision, memoryId, cogneeId };
}