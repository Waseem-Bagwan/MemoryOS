// ─────────────────────────────────────────────────────────────
// adapters/redis.adapter.ts
// All Redis operations go through here.
//
// Redis does two jobs in MemoryOS:
//
// JOB 1: Session message cache
//   The last N messages of a conversation are kept
//   in Redis as a list. When the pipeline needs context,
//   it reads from Redis (fast) instead of Postgres (slow).
//   After 2 hours of inactivity, Redis auto-evicts them.
//
// JOB 2: Memory importance index (sorted set)
//   We maintain a sorted set per user where:
//   - key   = memory ID
//   - score = importance (0.0 to 1.0)
//   This lets us instantly answer: "what are the top 10
//   memories for this user?" without querying Postgres.
// ─────────────────────────────────────────────────────────────
import { getRedisClient, RedisKeys, SESSION_TTL_SECONDS } from "../config/redis";
import { env } from "../config/env";

export const redisAdapter = {
  // ─────────────────────────────────────────
  // Session message cache
  // ─────────────────────────────────────────

  // Add a message to the session's message list
  async addSessionMessage(
    sessionId: string,
    role: "user" | "assistant",
    content: string
  ): Promise<void> {
    try {
      const client = await getRedisClient();
      const key = RedisKeys.sessionMessages(sessionId);
      const message = JSON.stringify({ role, content, ts: Date.now() });

      // RPUSH adds to end of list
      await client.rPush(key, message);
      // Keep only last 20 messages to prevent unbounded growth
      await client.lTrim(key, -20, -1);
      // Reset TTL on every new message (session stays alive while active)
      await client.expire(key, SESSION_TTL_SECONDS);
    } catch (error) {
      // Redis failures are non-fatal — we can still use Postgres
      console.warn("[Redis] addSessionMessage failed:", error);
    }
  },

  // Get recent messages for a session (for LLM context)
  async getSessionMessages(
    sessionId: string
  ): Promise<Array<{ role: string; content: string; ts: number }>> {
    try {
      const client = await getRedisClient();
      const key = RedisKeys.sessionMessages(sessionId);
      const raw = await client.lRange(key, 0, -1);
      return raw.map((m: string) => JSON.parse(m));
    } catch {
      return [];
    }
  },

  // ─────────────────────────────────────────
  // Memory importance index (sorted set)
  // ─────────────────────────────────────────

  // Add or update a memory in the importance index
  async addToMemoryIndex(
    userId: string,
    memoryId: string,
    importance: number
  ): Promise<void> {
    try {
      const client = await getRedisClient();
      const key = RedisKeys.userMemories(userId);
      // ZADD key score member
      await client.zAdd(key, { score: importance, value: memoryId });
    } catch (error) {
      console.warn("[Redis] addToMemoryIndex failed:", error);
    }
  },

  // Remove a memory from the index (called on FORGET)
  async removeFromMemoryIndex(
    userId: string,
    memoryId: string
  ): Promise<void> {
    try {
      const client = await getRedisClient();
      const key = RedisKeys.userMemories(userId);
      await client.zRem(key, memoryId);
    } catch (error) {
      console.warn("[Redis] removeFromMemoryIndex failed:", error);
    }
  },

  // Get top N memory IDs by importance
  // Returns highest importance first (ZREVRANGE)
  async getTopMemoryIds(
    userId: string,
    limit: number = 10
  ): Promise<string[]> {
    try {
      const client = await getRedisClient();
      const key = RedisKeys.userMemories(userId);
      // ZREVRANGE returns highest scores first
      return await client.zRange(key, 0, limit - 1, { REV: true });
    } catch {
      return [];
    }
  },

  // ─────────────────────────────────────────
  // Ingest lock — prevent race conditions
  // If two messages come in simultaneously,
  // only one pipeline runs at a time per user.
  // ─────────────────────────────────────────
  async acquireLock(userId: string): Promise<boolean> {
    try {
      const client = await getRedisClient();
      const key = RedisKeys.ingestLock(userId);
      // SET key value NX EX seconds
      // NX = only set if key doesn't exist
      // Returns "OK" if acquired, null if already locked
      const result = await client.set(key, "1", { NX: true, EX: 30 });
      return result === "OK";
    } catch {
      return true; // If Redis is down, allow through
    }
  },

  async releaseLock(userId: string): Promise<void> {
    try {
      const client = await getRedisClient();
      await client.del(RedisKeys.ingestLock(userId));
    } catch {
      // Ignore
    }
  },
};