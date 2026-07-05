// ─────────────────────────────────────────────────────────────
// services/auth.service.ts
// Business logic for auth.
// Controllers call services. Services talk to the database.
// ─────────────────────────────────────────────────────────────
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { AppError } from "../middleware/errorhandle";
import { JWTPayload } from "../types";

export const authService = {
  async register(email: string, password: string, name?: string) {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError("Email already registered", 409);
    }

    // Hash password — never store plain text
    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, password: hashed, name },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    const token = generateToken({ userId: user.id, email: user.email });
    return { user, token };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new AppError("Invalid email or password", 401);
    }

    const token = generateToken({ userId: user.id, email: user.email });
    return {
      user: { id: user.id, email: user.email, name: user.name },
      token,
    };
  },
};

function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}