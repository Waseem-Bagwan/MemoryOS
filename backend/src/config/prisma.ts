// ─────────────────────────────────────────────────────────────
// Singleton Prisma client.
// We create ONE instance and reuse it everywhere.
// In dev, we attach it to `global` so hot-reloading
// (nodemon) doesn't create a new connection every save.
// This is a standard Prisma pattern for Node.js.
// ─────────────────────────────────────────────────────────────
import { PrismaClient } from "@prisma/client";
import { env } from "./env";

// Extend the global type so TypeScript knows about our global prisma
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const prisma =
  global.__prisma ??
  new PrismaClient({
    log: env.IS_DEV ? ["query", "error", "warn"] : ["error"],
  });

if (env.IS_DEV) {
  global.__prisma = prisma;
}

export { prisma };