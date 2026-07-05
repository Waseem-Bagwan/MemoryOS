// ─────────────────────────────────────────────────────────────
// routes/memory.routes.ts
// All memory routes require authentication.
// ─────────────────────────────────────────────────────────────
import { Router } from "express";
import { memoryController } from "../controllers/memory.controller";
import { authMiddleware } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorhandle";

const router = Router();

// Every route below this line requires a valid JWT
router.use(authMiddleware);

// POST /api/memory/ingest  — the core MemoryOS endpoint
router.post("/ingest", asyncHandler(memoryController.ingest));

// POST /api/memory/recall  — search memories by query
router.post("/recall", asyncHandler(memoryController.recall));

// POST /api/memory/agent-context — get formatted context for LLM
router.post("/agent-context", asyncHandler(memoryController.getAgentContext));

// GET /api/memory  — list memories
router.get("/", asyncHandler(memoryController.listMemories));

// GET /api/memory/decisions  — the explainability audit log
router.get("/decisions", asyncHandler(memoryController.getDecisions));

// GET /api/memory/context/:sessionId  — hot session context
router.get(
  "/context/:sessionId",
  asyncHandler(memoryController.getContext)
);

export default router;