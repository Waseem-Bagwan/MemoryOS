import { Request, Response } from "express";
import { z } from "zod";
import { chatService } from "../services/chat.service";

const MessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(2000),
  sessionId: z.string().min(1, "sessionId is required"),
});

export const chatController = {
  // POST /api/chat/message
  // The main chat endpoint. Receives a user message,
  // returns an AI reply that's aware of the user's memories.
  async sendMessage(req: Request, res: Response): Promise<void> {
    const parsed = MessageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues[0].message,
      });
      return;
    }

    const userId = req.user!.userId;
    const { message, sessionId } = parsed.data;

    const result = await chatService.sendMessage(userId, message, sessionId);

    res.json({
      success: true,
      data: result,
    });
  },
};