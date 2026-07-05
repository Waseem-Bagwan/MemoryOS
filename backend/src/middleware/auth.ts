// JWT authentication middleware.
//
// How it works:
// 1. Client sends: Authorization: Bearer <token>
// 2. We verify the token with our JWT_SECRET
// 3. We attach the decoded payload to req.user
// 4. Next middleware/controller can read req.user.userId
//
// If token is missing or invalid → 401 Unauthorized
// ─────────────────────────────────────────────────────────────
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { JWTPayload } from "../types";

// Extend Express Request to include our user payload
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "No token provided. Add: Authorization: Bearer <token>",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, error: "Token expired" });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, error: "Invalid token" });
    } else {
      res.status(500).json({ success: false, error: "Auth error" });
    }
  }
}