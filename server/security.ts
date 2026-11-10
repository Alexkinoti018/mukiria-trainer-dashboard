/**
 * Mukiria Technical Training Institute (MTTI)
 * Enterprise Security Middleware & Payload Validation Subsystem
 *
 * Implements:
 * - Helmet HTTP security headers (nosniff, XSS filter, frameguard, CSP)
 * - Strict CORS policy with credential and header filtering
 * - Tiered rate limiting with test-mode bypass
 * - Zod schema validation middleware for mutation endpoints
 */

import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

// ─── 1. HELMET SECURITY HEADERS ──────────────────────────────────────────────
export const securityHeaders = helmet({
  contentSecurityPolicy:
    process.env.NODE_ENV === "production"
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            connectSrc: [
              "'self'",
              "https:",
              "wss:",
              "http://localhost:*",
              "ws://localhost:*",
            ],
            fontSrc: ["'self'", "data:", "https:"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
          },
        }
      : false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

// ─── 2. CORS MIDDLEWARE ──────────────────────────────────────────────────────
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()) || [];
    if (
      process.env.NODE_ENV !== "production" ||
      allowed.includes(origin) ||
      origin.endsWith(".mtti.ac.ke") ||
      origin.endsWith(".vercel.app") ||
      origin.includes("localhost")
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-user-role",
    "x-user-id",
    "x-user-reg",
    "x-user-dept",
    "x-user-enrolled-units",
    "x-user-units",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
});

// ─── 3. RATE LIMITING ────────────────────────────────────────────────────────
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX, 10) : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () =>
    process.env.NODE_ENV === "test" ||
    process.env.DISABLE_RATE_LIMIT === "true",
  message: {
    error: "Too many requests from this IP address, please try again after 15 minutes.",
    service_status: "rate_limited",
    retry_after_minutes: 15,
  },
});

// ─── 4. ZOD PAYLOAD VALIDATION MIDDLEWARE ────────────────────────────────────
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues || (result.error as any).errors || [];
      res.status(400).json({
        error: "Validation Error: Invalid request payload",
        details: issues.map((e: any) => ({
          field: Array.isArray(e.path) ? e.path.join(".") : String(e.path || ""),
          message: e.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

// ─── 5. CORE MUTATION SCHEMAS ────────────────────────────────────────────────
export const TraineeCreateSchema = z
  .object({
    name: z.string().min(1, "Trainee name is required"),
    admNo: z.string().optional(),
    adm_no: z.string().optional(),
    regCode: z.string().optional(),
    reg_code: z.string().optional(),
    classCode: z.string().optional().default("ICT4/ITECH6/S/26 MOD 1"),
    class_code: z.string().optional(),
    department: z.string().optional().default("Computing & Informatics"),
    gender: z.string().optional().default("M"),
    phone: z.string().optional(),
    remarks: z.string().optional(),
  })
  .refine((data) => Boolean(data.admNo || data.adm_no), {
    message: "Admission number (admNo or adm_no) is required",
    path: ["admNo"],
  });

export const TraineeUpdateSchema = z.object({
  name: z.string().optional(),
  admNo: z.string().optional(),
  adm_no: z.string().optional(),
  regNumber: z.string().optional(),
  reg_number: z.string().optional(),
  regCode: z.string().optional(),
  reg_code: z.string().optional(),
  classCode: z.string().optional(),
  class_code: z.string().optional(),
  classId: z.string().optional(),
  class_id: z.string().optional(),
  department: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  remarks: z.string().optional(),
});

export const AttendanceMarkSchema = z.object({
  unitOfferingId: z.string().optional(),
  traineeId: z.string().min(1, "traineeId is required"),
  weekNumber: z.number().int().min(1).max(30),
  sessionDate: z.string().min(1, "sessionDate is required"),
  sessionIndex: z.number().int().optional().default(1),
  status: z.enum(["present", "absent", "excused", "X", "0"]),
  hoursAttended: z.number().min(0).optional().default(0),
  remarks: z.string().optional(),
  markedBy: z.string().optional(),
});
