/**
 * Mukiria Technical Training Institute (MTTI)
 * Role-Based Access Control (RBAC) & JWT Authentication Middleware
 * File: server/middleware/auth.ts
 */

import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { getAuthConfiguration, verifySupabaseToken, DEMO_TOKENS_MAP } from "../auth.ts";

export interface UserPayload {
  id: string;
  email?: string;
  admission_number?: string | null;
  reg_number?: string | null;
  full_name?: string;
  name?: string;
  role: "TRAINEE" | "TRAINER" | "HOD" | "ADMIN" | string;
  department_id?: string;
  assigned_units?: string[];
  enrolled_units?: string[];
  [key: string]: any;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export function getJwtSecret(): string {
  return (
    process.env.SUPABASE_JWT_SECRET ||
    process.env.JWT_SECRET ||
    "mtti-enterprise-jwt-secret-secure-key-2026"
  );
}

/**
 * Middleware: Verifies JWT token from Authorization Bearer header.
 * Attaches the verified user profile to `req.user`.
 */
export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  const tokenString = typeof authHeader === "string" ? authHeader : "";

  if (!tokenString || !tokenString.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Unauthorized: Missing or invalid Authorization Bearer header",
    });
    return;
  }

  const token = tokenString.replace(/^Bearer\s+/i, "").trim();
  const config = getAuthConfiguration();

  // 1. Check demo token mapping if permitted
  if (token in DEMO_TOKENS_MAP) {
    if (!config.allowDemoAuth) {
      res.status(401).json({
        error: "Unauthorized: Demo tokens are disabled in production mode",
      });
      return;
    }
    const demoUser = DEMO_TOKENS_MAP[token];
    req.user = {
      ...demoUser,
      role: demoUser.role.toUpperCase(),
      admission_number: demoUser.reg_number,
      full_name: demoUser.name,
    };
    next();
    return;
  }

  // 2. Standard JWT verification (supports local JWT secret & Supabase JWT)
  const secret = getJwtSecret();
  try {
    const decoded = jwt.verify(token, secret) as any;
    const rawRole =
      decoded.role ||
      decoded.user_metadata?.role ||
      decoded.app_metadata?.role ||
      "TRAINEE";

    req.user = {
      id: decoded.id || decoded.sub,
      email: decoded.email,
      admission_number:
        decoded.admission_number ||
        decoded.reg_number ||
        decoded.user_metadata?.admission_number ||
        decoded.user_metadata?.reg_number ||
        null,
      full_name:
        decoded.full_name ||
        decoded.name ||
        decoded.user_metadata?.full_name ||
        decoded.user_metadata?.name ||
        "",
      role: String(rawRole).toUpperCase(),
      department_id: decoded.department_id || decoded.user_metadata?.department_id,
      assigned_units: decoded.assigned_units || decoded.user_metadata?.assigned_units,
      enrolled_units: decoded.enrolled_units || decoded.user_metadata?.enrolled_units,
    };
    next();
    return;
  } catch (jwtErr: any) {
    // If standard verification failed, try Supabase cryptographic token parsing
    try {
      const supaUser = await verifySupabaseToken(token);
      req.user = {
        ...supaUser,
        role: supaUser.role.toUpperCase(),
        admission_number: supaUser.reg_number,
        full_name: supaUser.name,
      };
      next();
      return;
    } catch (supaErr: any) {
      res.status(401).json({
        error: `Unauthorized: Invalid or expired authentication token (${jwtErr.message || supaErr.message})`,
      });
      return;
    }
  }
}

/**
 * Route-level Role Protection Guard.
 * Usage:
 *   router.get("/trainee-only", requireRole("TRAINEE"), handler);
 *   router.post("/staff-only", requireRole("ADMIN", "HOD", "TRAINER"), handler);
 */
export function requireRole(...allowedRoles: string[]) {
  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // If token has not been verified yet, verify it now
    if (!req.user) {
      authenticateToken(req, res, () => {
        if (!req.user) {
          res.status(401).json({ error: "Unauthorized: Authentication required" });
          return;
        }
        enforceRole(req, res, next, normalizedAllowed);
      });
      return;
    }

    enforceRole(req, res, next, normalizedAllowed);
  };
}

function enforceRole(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
  normalizedAllowed: string[]
): void {
  const userRole = (req.user?.role || "").toUpperCase();

  if (!normalizedAllowed.includes(userRole)) {
    res.status(403).json({
      error: `Forbidden: Access requires role [${normalizedAllowed.join(", ")}], but user holds '${userRole}'`,
    });
    return;
  }

  next();
}

// Aliases for compatibility
export const requireRoles = requireRole;
export const authenticateUser = authenticateToken;
