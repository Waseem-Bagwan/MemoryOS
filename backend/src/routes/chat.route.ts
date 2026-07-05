import { Router } from "express";
import { chatController } from "../controllers/chat.controller";
import { authMiddleware } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorhandle";

const router = Router();

router.use(authMiddleware);

// POST /api/chat/message
router.post("/message", asyncHandler(chatController.sendMessage));

export default router;