// ─────────────────────────────────────────────────────────────
// routes/auth.routes.ts
// ─────────────────────────────────────────────────────────────
import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { asyncHandler } from "../middleware/errorhandle";

const router = Router();

// POST /api/auth/register
router.post("/register", asyncHandler(authController.register));

// POST /api/auth/login
router.post("/login", asyncHandler(authController.login));

export default router;