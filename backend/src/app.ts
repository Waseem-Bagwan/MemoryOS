// ─────────────────────────────────────────────────────────────
// app.ts
// Express app configuration — separate from server.ts so
// tests can import `app` without starting a real server.
// ─────────────────────────────────────────────────────────────
import express, { Application } from "express";
import cors from "cors";
import { env } from "./config/env";
import routes from "./routes";
import { errorHandler } from "./middleware/errorhandle";

export function createApp(): Application {
  const app = express();

  // ── Core middleware ──
  const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL,
  ].filter((origin): origin is string => Boolean(origin));

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  // ── Request logging (simple, dev-friendly) ──
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });

  // ── Routes ──
  app.use("/api", routes);

  // ── 404 handler ──
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: `Route not found: ${req.method} ${req.path}`,
    });
  });

  // ── Global error handler (must be last) ──
  app.use(errorHandler);

  return app;
}