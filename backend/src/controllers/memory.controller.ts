// ─────────────────────────────────────────────────────────────
// controllers/memory.controller.ts
// ─────────────────────────────────────────────────────────────
import { Request, Response } from "express";
import { z } from "zod";
import { memoryService } from "../services/memory.service";

const IngestSchema = z.object({
  content: z.string().min(1, "Content cannot be empty").max(2000),
  sessionId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const RecallSchema = z.object({
  query: z.string().min(1),
  limit: z.coerce.number().min(1).max(50).optional(),
});

export const memoryController = {
  // POST /api/memory/ingest
  // The core endpoint — processes a message through the pipeline
  async ingest(req: Request, res: Response): Promise<void> {
    const parsed = IngestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues[0].message,
      });
      return;
    }

    const userId = req.user!.userId;
    const result = await memoryService.ingest(userId, parsed.data);

    res.status(201).json({
      success: true,
      data: result,
    });
  },

  // POST /api/memory/agent-context
  // Returns memories formatted as LLM context string.
  // This is what the chat agent calls before generating a response.
  // Instead of dumping all memories, it searches for relevant ones.
  async getAgentContext(req: Request, res: Response): Promise<void> {
    const { query, maxTokens } = req.body as {
      query: string;
      maxTokens?: number;
    };

    if (!query) {
      res.status(400).json({ success: false, error: "query is required" });
      return;
    }

    const userId = req.user!.userId;
    const context = await memoryService.buildAgentContext(
      userId,
      query,
      maxTokens ?? 1500
    );

    res.json({ success: true, data: context });
  },

  // POST /api/memory/recall
  // Retrieve relevant memories for a query
  async recall(req: Request, res: Response): Promise<void> {
    const parsed = RecallSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "query is required" });
      return;
    }

    const userId = req.user!.userId;
    const memories = await memoryService.recall(
      userId,
      parsed.data.query,
      parsed.data.limit
    );

    res.json({ success: true, data: { memories, count: memories.length } });
  },

  // GET /api/memory
  // List all memories for the authenticated user
  async listMemories(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { type, lifecycle, limit, offset } = req.query;

    const memories = await memoryService.getUserMemories(userId, {
      type: type as string | undefined,
      lifecycle: lifecycle as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json({ success: true, data: { memories, count: memories.length } });
  },

  // GET /api/memory/decisions
  // Return the decision audit log — the explainability feature
  async getDecisions(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { sessionId, limit, offset } = req.query;

    const logs = await memoryService.getDecisionLog(userId, {
      sessionId: sessionId as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json({ success: true, data: { decisions: logs, count: logs.length } });
  },

  // GET /api/memory/context/:sessionId
  // Get hot session context (Redis messages + top memories)
  async getContext(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { sessionId } = req.params;

    const context = await memoryService.getSessionContext(
      userId,
      String(sessionId)
    );
    res.json({ success: true, data: context });
  },
};