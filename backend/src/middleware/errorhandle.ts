// ─────────────────────────────────────────────────────────────
// middleware/errorHandler.ts
// Global error handler — catches any error thrown in a
// controller/service and returns a clean JSON response.
//
// Why this matters:
// Without this, Express returns HTML error pages.
// With this, every error comes back as clean JSON.
// ─────────────────────────────────────────────────────────────
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

// Custom error class so we can attach HTTP status codes
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // In development, send the full stack trace.
  // In production, send a generic message.
  res.status(500).json({
    success: false,
    error: "Internal server error",
    ...(env.IS_DEV && { stack: err.stack, detail: err.message }),
  });
}

// Wraps async route handlers so we don't write
// try/catch in every controller.
//
// Instead of:
//   router.post("/", async (req, res, next) => {
//     try { ... } catch (e) { next(e) }
//   })
//
// You write:
//   router.post("/", asyncHandler(async (req, res) => { ... }))
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}