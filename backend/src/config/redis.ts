import { createClient } from "redis";
import { env } from "./env";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redisClient: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getRedisClient(): Promise<any> {
  if (redisClient) return redisClient;

  const client = createClient({ url: env.REDIS_URL });

  client.on("error", (err: Error) => console.error("Redis error:", err));
  client.on("connect", () => console.log("✅ Redis connected"));

  await client.connect();
  redisClient = client;
  return client;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

export const RedisKeys = {
  sessionMessages: (sessionId: string) => `session:${sessionId}:messages`,
  userMemories:    (userId: string)    => `user:${userId}:memories`,
  ingestLock:      (userId: string)    => `lock:ingest:${userId}`,
} as const;

export const SESSION_TTL_SECONDS = 60 * 60 * 2;