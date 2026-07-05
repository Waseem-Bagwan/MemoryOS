// ─────────────────────────────────────────────────────────────
// Single place to read + validate all environment variables.
// ─────────────────────────────────────────────────────────────
import dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env variable: ${key}`);
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  PORT:     parseInt(optional("PORT", "3000"), 10),
  NODE_ENV: optional("NODE_ENV", "development"),
  IS_DEV:   optional("NODE_ENV", "development") === "development",

  DATABASE_URL: required("DATABASE_URL"),

  JWT_SECRET:     required("JWT_SECRET"),
  JWT_EXPIRES_IN: optional("JWT_EXPIRES_IN", "7d"),

  REDIS_URL: optional("REDIS_URL", "redis://localhost:6379"),

  // OpenAI — used by the decision engine (analyze.ts)
  OPENAI_API_KEY: required("OPENAI_API_KEY"),

  // Cognee Cloud — from your dashboard
  COGNEE_API_URL:   required("COGNEE_API_URL"),
  COGNEE_API_KEY:   required("COGNEE_API_KEY"),
  COGNEE_TENANT_ID: required("COGNEE_TENANT_ID"),

  FRONTEND_URL: optional("FRONTEND_URL", "http://localhost:5173"),
} as const;


