import OpenAI from "openai";
import { env } from "../config/env";
import { memoryService } from "./memory.service";
import { redisAdapter } from "../adapters/redis.adapter";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
  memoriesUsed: number;
  memoryContext: string;   // shown in frontend decision panel
}

export const chatService = {
  async sendMessage(
    userId: string,
    userMessage: string,
    sessionId: string
  ): Promise<ChatResponse> {

    // ─────────────────────────────────────────
    // Step 1: Build memory context
    // What does the agent know about this user?
    // This is the core MemoryOS value-add.
    // ─────────────────────────────────────────
    const { contextString, memoriesUsed } = await memoryService.buildAgentContext(
      userId,
      userMessage,
      1500
    );

    // ─────────────────────────────────────────
    // Step 2: Get recent session history from Redis
    // Last few messages for conversational continuity
    // ─────────────────────────────────────────
    const recentMessages = await redisAdapter.getSessionMessages(sessionId);
    const conversationHistory: ChatMessage[] = recentMessages
      .slice(-6) // last 3 exchanges (6 messages)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    // ─────────────────────────────────────────
    // Step 3: Call OpenAI with memory context
    // The system prompt is what makes the agent
    // "remember" — it's injected with real memories.
    // ─────────────────────────────────────────
    const systemPrompt = memoriesUsed > 0
      ? `You are a helpful AI assistant with persistent memory.

        You remember things about this user from previous conversations.
        Use this knowledge naturally in your responses — don't announce that you're using memory,
        just respond as if you naturally know these things.

        ${contextString}

        Guidelines:
        - Be conversational and warm
        - Reference what you know about the user when relevant
        - If the user shares new information, acknowledge it naturally
        - Keep responses concise unless the user asks for detail`
            : `You are a helpful AI assistant. Be conversational and warm.
        Keep responses concise unless the user asks for detail.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 500,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: userMessage },
      ],
    });

    const reply = response.choices[0]?.message?.content ?? "I couldn't generate a response.";

    // ─────────────────────────────────────────
    // Step 4: Save to Redis session cache
    // Both the user message and assistant reply
    // go into the session history for next turn.
    // ─────────────────────────────────────────
    await redisAdapter.addSessionMessage(sessionId, "user", userMessage);
    await redisAdapter.addSessionMessage(sessionId, "assistant", reply);

    // ─────────────────────────────────────────
    // Step 5: Ingest user message into memory (async)
    // We don't await this — it runs in the background.
    // This means the user gets their response immediately
    // without waiting for Cognee's 3-4 second processing.
    // If it fails, it logs but doesn't break the chat.
    // ─────────────────────────────────────────
    memoryService
      .ingest(userId, { content: userMessage, sessionId })
      .catch((err) => console.warn("[Chat] Background memory ingest failed:", err));

    return {
      reply,
      sessionId,
      memoriesUsed,
      memoryContext: contextString,
    };
  },
};