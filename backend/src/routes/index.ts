// ─────────────────────────────────────────────────────────────
// routes/index.ts
// Combines all route modules into one router.
// ─────────────────────────────────────────────────────────────
import { Router } from "express";
import authRoutes from "./auth.route";
import memoryRoutes from "./memory.route";
import chatRoutes from "./chat.route";

const router = Router();

router.use("/auth", authRoutes);
router.use("/memory", memoryRoutes);
router.use("/chat", chatRoutes);

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "MemoryOS is running", timestamp: new Date() });
});

export default router;