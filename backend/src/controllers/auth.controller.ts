// ─────────────────────────────────────────────────────────────
// controllers/auth.controller.ts
// Handles HTTP for auth routes. Thin layer — just
// validates input, calls service, returns response.
// ─────────────────────────────────────────────────────────────
import { Request, Response } from "express";
import { z } from "zod";
import { authService } from "../services/auth.service";

const RegisterSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues[0].message,
      });
      return;
    }

    const { email, password, name } = parsed.data;
    const result = await authService.register(email, password, name);

    res.status(201).json({
      success: true,
      data: result,
      message: "Account created successfully",
    });
  },

  async login(req: Request, res: Response): Promise<void> {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Invalid email or password format",
      });
      return;
    }

    const { email, password } = parsed.data;
    const result = await authService.login(email, password);

    res.json({
      success: true,
      data: result,
      message: "Logged in successfully",
    });
  },
};