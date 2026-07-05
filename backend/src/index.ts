// ─────────────────────────────────────────────────────────────
// index.ts
// The actual entry point. Starts the HTTP server,
// connects to Redis, and handles graceful shutdown.
// ─────────────────────────────────────────────────────────────
import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { getRedisClient, closeRedis } from "./config/redis";

async function main(): Promise<void> {
  // Connect to Redis before accepting traffic
  await getRedisClient();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`
🧠 MemoryOS is running
   Port:        ${env.PORT}
   Environment: ${env.NODE_ENV}
   Health:      http://localhost:${env.PORT}/api/health
    `);
  });

  // ── Graceful shutdown ──
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      await closeRedis();
      console.log("Shutdown complete.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("Failed to start MemoryOS:", err);
  process.exit(1);
});