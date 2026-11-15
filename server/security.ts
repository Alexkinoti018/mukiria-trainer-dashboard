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
import jwt from "jsonwebtoken";
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
    return callback(null, false);
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
    "x-test-rate-limit",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
});

// ─── 3. LAB-SAFE IDENTITY-BASED RATE LIMITING ───────────────────────────────

/**
 * Lab-Safe Key Generator:
 * Identifies users by authenticated user ID or trainee admission/registration number.
 * Only falls back to client IP for unauthenticated anonymous attempts with generous
 * institutional NAT gateway thresholds.
 *
 * Guarantees that 60+ trainees sitting in Mukiria Lab 1 submitting simultaneously
 * over the same lab public IP address each have an isolated rate limit quota and are
 * never throttled or blocked by their classmates' traffic.
 */
/**
 * Safely extracts client IP respecting Express trust proxy configuration.
 */
export function getClientIp(req: Request): string {
  if (req.ip) return req.ip;
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  return req.socket?.remoteAddress || "127.0.0.1";
}

/**
 * Normalizes login/auth candidate identifier (email or admission number).
 */
export function normalizeAuthIdentifier(raw: any): string {
  if (typeof raw !== "string") return "";
  return raw.trim().toLowerCase().replace(/\s+/g, "");
}

/**
 * Strict authentication limiter key generator.
 * Strictly combines client IP with normalized candidate identifier.
 * NEVER trusts spoofable client headers (x-user-id, x-user-reg) or unverified JWT claims.
 */
export function getAuthRateLimitKey(req: Request): string {
  const ip = getClientIp(req);
  const body = req.body || {};
  const rawId =
    body.identifier ||
    body.email ||
    body.admission_number ||
    body.admissionNumber ||
    body.reg_number ||
    body.regNumber ||
    body.adm_no ||
    body.admNo ||
    body.username ||
    "";
  const normalizedId = normalizeAuthIdentifier(rawId);
  return normalizedId ? `auth:${ip}:${normalizedId}` : `auth:${ip}`;
}

/**
 * Global API rate limit key:
 * Uses cryptographically authenticated user profile if present; otherwise client IP.
 * NEVER trusts spoofable headers or unverified tokens.
 */
export function getLabSafeRateLimitKey(req: Request): string {
  const user = (req as any).user;
  if (user && typeof user === "object") {
    if (user.id) return `user:${user.id}`;
    if (user.user_id) return `user:${user.user_id}`;
    if (user.reg_number) return `trainee:${String(user.reg_number).trim().toUpperCase()}`;
    if (user.admission_number) return `trainee:${String(user.admission_number).trim().toUpperCase()}`;
  }
  return `ip:${getClientIp(req)}`;
}

// ─── ACCOUNT LOCKOUT STATE & ENGINE ─────────────────────────────────────────

interface AccountLockoutRecord {
  failedAttempts: number;
  lockedUntil: number | null;
  lastAttemptAt: number;
}

const accountLockouts = new Map<string, AccountLockoutRecord>();

export const ACCOUNT_LOCKOUT_MAX_ATTEMPTS = 5;
export const ACCOUNT_LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function getAccountLockoutStatus(identifier: string): {
  isLocked: boolean;
  remainingMs: number;
  attempts: number;
} {
  const cleanId = normalizeAuthIdentifier(identifier);
  if (!cleanId) return { isLocked: false, remainingMs: 0, attempts: 0 };

  const record = accountLockouts.get(cleanId);
  if (!record) return { isLocked: false, remainingMs: 0, attempts: 0 };

  const now = Date.now();
  if (record.lockedUntil && record.lockedUntil > now) {
    return {
      isLocked: true,
      remainingMs: record.lockedUntil - now,
      attempts: record.failedAttempts,
    };
  }

  // If lockout expired, reset
  if (record.lockedUntil && record.lockedUntil <= now) {
    accountLockouts.delete(cleanId);
    return { isLocked: false, remainingMs: 0, attempts: 0 };
  }

  return { isLocked: false, remainingMs: 0, attempts: record.failedAttempts };
}

export function recordFailedAuthAttempt(identifier: string): {
  isLocked: boolean;
  remainingMs: number;
  attempts: number;
} {
  const cleanId = normalizeAuthIdentifier(identifier);
  if (!cleanId) return { isLocked: false, remainingMs: 0, attempts: 0 };

  const now = Date.now();
  const record = accountLockouts.get(cleanId) || {
    failedAttempts: 0,
    lockedUntil: null,
    lastAttemptAt: now,
  };

  record.failedAttempts += 1;
  record.lastAttemptAt = now;

  if (record.failedAttempts >= ACCOUNT_LOCKOUT_MAX_ATTEMPTS) {
    record.lockedUntil = now + ACCOUNT_LOCKOUT_DURATION_MS;
    accountLockouts.set(cleanId, record);
    return {
      isLocked: true,
      remainingMs: ACCOUNT_LOCKOUT_DURATION_MS,
      attempts: record.failedAttempts,
    };
  }

  accountLockouts.set(cleanId, record);
  return { isLocked: false, remainingMs: 0, attempts: record.failedAttempts };
}

export function resetAccountLockout(identifier: string): void {
  const cleanId = normalizeAuthIdentifier(identifier);
  if (cleanId) {
    accountLockouts.delete(cleanId);
  }
}

export function clearAllAccountLockouts(): void {
  accountLockouts.clear();
}

export function shouldSkipRateLimit(req: Request): boolean {
  if (req.headers["x-test-rate-limit"] === "true" || process.env.ENABLE_RATE_LIMIT_TEST === "true") {
    return false;
  }
  return process.env.NODE_ENV === "test" || process.env.DISABLE_RATE_LIMIT === "true";
}

/**
 * Global API rate limiter with lab-safe identity resolution
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: Request) => {
    const key = getLabSafeRateLimitKey(req);
    return key.startsWith("ip:") ? 1000 : 300;
  },
  keyGenerator: (req: Request) => getLabSafeRateLimitKey(req),
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  message: {
    error: "Too many requests. Please try again after a few minutes.",
    service_status: "rate_limited",
    retry_after_minutes: 15,
  },
});

/**
 * Authentication rate limiter for /api/auth/*
 * Generous NAT threshold for campus labs, per-identity throttling for brute-force defense
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: Request) => {
    const key = getAuthRateLimitKey(req);
    // Institutional NAT allows up to 1000 general attempts; individual candidate is limited to 20
    return key.startsWith("auth:") && key.split(":").length > 2 ? 20 : 1000;
  },
  keyGenerator: (req: Request) => getAuthRateLimitKey(req),
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  message: {
    error: "Too many authentication requests. Institutional rate limit exceeded. Please wait 15 minutes.",
    service_status: "rate_limited",
    retry_after_minutes: 15,
  },
});

/**
 * Submissions rate limiter for /api/submissions/*
 * High throughput per trainee (autosaves + submit), isolated per candidate so lab peers never collide
 */
export const submissionsRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: (req: Request) => {
    const key = getLabSafeRateLimitKey(req);
    // 60 requests per minute per trainee (300 per 5 min)
    return key.startsWith("ip:") ? 3000 : 300;
  },
  keyGenerator: (req: Request) => getLabSafeRateLimitKey(req),
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  message: {
    error: "Submission rate limit exceeded. Offline buffer is active; queued items will sync automatically.",
    service_status: "rate_limited",
    retry_after_minutes: 5,
  },
});

/**
 * Exams rate limiter for /api/exams/*
 */
export const examsRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: (req: Request) => {
    const key = getLabSafeRateLimitKey(req);
    return key.startsWith("ip:") ? 3000 : 300;
  },
  keyGenerator: (req: Request) => getLabSafeRateLimitKey(req),
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  message: {
    error: "Exam query rate limit exceeded. Please wait a moment.",
    service_status: "rate_limited",
    retry_after_minutes: 5,
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
