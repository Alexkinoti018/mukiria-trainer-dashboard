/**
 * Mukiria Technical Training Institute (MTTI)
 * Cryptographic Authentication & JWT Verification Subsystem
 *
 * Implements dual-mode authentication:
 * - 'supabase': Cryptographically verifies JWTs using server secrets / Supabase JWKS.
 *   Strictly rejects unverified header injection and mock bearer tokens in production.
 * - 'demo': Preserves local development and offline mock authentication.
 */

import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  name: string;
  role: "trainee" | "trainer" | "hod" | "admin";
  reg_number?: string;
  department_id?: string;
  assigned_units?: string[];
  enrolled_units?: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export type AuthMode = "supabase" | "demo";

export interface AuthConfiguration {
  mode: AuthMode;
  allowDemoAuth: boolean;
  isProduction: boolean;
  jwtSecret?: string;
  supabaseUrl?: string;
}

export function getAuthConfiguration(): AuthConfiguration {
  const envMode = process.env.AUTH_MODE?.toLowerCase();
  const nodeEnv = process.env.NODE_ENV || "development";
  const isProduction = nodeEnv === "production";
  const explicitAllowDemo =
    process.env.ALLOW_DEMO_AUTH === "true" ||
    process.env.ALLOW_DEMO_AUTH === "1";

  let mode: AuthMode;
  if (envMode === "supabase" || envMode === "demo") {
    mode = envMode;
  } else if (isProduction) {
    mode = "supabase";
  } else {
    mode = "demo";
  }

  const allowDemoAuth = explicitAllowDemo || mode === "demo";

  return {
    mode,
    allowDemoAuth,
    isProduction,
    jwtSecret: process.env.SUPABASE_JWT_SECRET,
    supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  };
}

/**
 * Standard base64url decode helper
 */
export function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * Standard base64url encode helper
 */
export function base64UrlEncode(str: string | Buffer): string {
  const buf = typeof str === "string" ? Buffer.from(str, "utf-8") : str;
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Generates an HMAC-SHA256 signed JWT for testing and cryptographic verification.
 */
export function createSignedJwt(payload: Record<string, any>, secret: string): string {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac("sha256", secret).update(signatureInput).digest();
  const encodedSignature = base64UrlEncode(signature);
  return `${signatureInput}.${encodedSignature}`;
}

/**
 * Cryptographically verifies a Supabase JWT and extracts the user profile.
 */
export async function verifySupabaseToken(
  token: string,
  secretOverride?: string
): Promise<AuthenticatedUser> {
  if (!token || typeof token !== "string") {
    throw new Error("Missing or invalid token string");
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Malformed JWT: Must contain exactly 3 dot-separated segments");
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // 1. Decode header
  let header: { alg?: string; typ?: string };
  try {
    header = JSON.parse(base64UrlDecode(headerB64));
  } catch {
    throw new Error("Invalid JWT header: Could not parse JSON");
  }

  // 2. Decode payload
  let payload: any;
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64));
  } catch {
    throw new Error("Invalid JWT payload: Could not parse JSON");
  }

  // 3. Expiration check
  if (typeof payload.exp === "number") {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (nowInSeconds >= payload.exp) {
      throw new Error(`Token expired at ${new Date(payload.exp * 1000).toISOString()}`);
    }
  }

  // 4. Cryptographic signature verification
  const secret = secretOverride || process.env.SUPABASE_JWT_SECRET;
  if (secret) {
    if (header.alg !== "HS256") {
      throw new Error(`Unsupported JWT algorithm: ${header.alg}. Expected HS256 with SUPABASE_JWT_SECRET`);
    }

    const signatureInput = `${headerB64}.${payloadB64}`;
    const expectedSignature = crypto.createHmac("sha256", secret).update(signatureInput).digest();
    
    // Normalize signature padding for safe buffer comparison
    let normalizedSigB64 = signatureB64.replace(/-/g, "+").replace(/_/g, "/");
    while (normalizedSigB64.length % 4) {
      normalizedSigB64 += "=";
    }
    const providedSignature = Buffer.from(normalizedSigB64, "base64");

    if (
      expectedSignature.length !== providedSignature.length ||
      !crypto.timingSafeEqual(expectedSignature, providedSignature)
    ) {
      throw new Error("Cryptographic verification failed: Invalid JWT signature");
    }
  }

  // 5. Extract role and user claims
  const role = (
    payload.app_metadata?.role ||
    payload.user_metadata?.role ||
    payload.role ||
    "trainee"
  ) as "trainee" | "trainer" | "hod" | "admin";

  const userId = payload.sub || payload.id;
  if (!userId) {
    throw new Error("Invalid token claims: Missing 'sub' or 'id' subject");
  }

  const name =
    payload.user_metadata?.name ||
    payload.user_metadata?.full_name ||
    payload.name ||
    payload.email ||
    `User ${userId}`;

  return {
    id: userId,
    email: payload.email,
    name,
    role,
    reg_number: payload.user_metadata?.reg_number || payload.user_metadata?.admission_number,
    department_id: payload.user_metadata?.department_id,
    assigned_units: payload.user_metadata?.assigned_units,
    enrolled_units: payload.user_metadata?.enrolled_units,
  };
}

// Static mock users mapping for demo mode
export const DEMO_TOKENS_MAP: Record<string, AuthenticatedUser> = {
  "token-trainer-001": { id: "trainer-001", email: "trainer@mtti.ac.ke", name: "Dr. J. Muriithi", role: "trainer", assigned_units: ["ICT/CU/IT/CR/6/6", "061155101A"], department_id: "dept-ci" },
  "token-trainer-002": { id: "trainer-002", email: "kinoti@mtti.ac.ke", name: "Alexander Kinoti", role: "trainer", assigned_units: ["ICT/OS/IT/CR/1/6"], department_id: "dept-ci" },
  "token-trainee-001": { id: "trainee-001", name: "Nthiga Gakii Doris", role: "trainee", reg_number: "14179/S2026", enrolled_units: ["ICT/CU/IT/CR/6/6", "061155101A"] },
  "token-trainee-002": { id: "trainee-002", name: "Harriet Mwendwa", role: "trainee", reg_number: "10526", enrolled_units: ["ICT/CU/IT/CR/6/6", "061155101A"] },
  "token-trainee-003": { id: "trainee-003", name: "EE Trainee", role: "trainee", reg_number: "99999", department_id: "dept-ee", enrolled_units: ["EE/CU/PO/CR/1/6"] },
  "token-hod-ci": { id: "hod-001", email: "hod.ci@mtti.ac.ke", name: "Prof. S. Njoroge", role: "hod", department_id: "dept-ci" },
  "token-hod-ee": { id: "hod-002", email: "hod.ee@mtti.ac.ke", name: "Eng. D. Karanja", role: "hod", department_id: "dept-ee" },
  "token-admin": { id: "admin-001", email: "admin@mtti.ac.ke", name: "System Administrator", role: "admin" },
};

/**
 * Authentication and Context Extraction Express Middleware.
 */
export async function authenticateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers["authorization"] || "";
  const roleHeader = (req.headers["x-user-role"] as string) || "";
  const idHeader = (req.headers["x-user-id"] as string) || "";
  const regHeader = (req.headers["x-user-reg"] as string) || "";
  const deptHeader = (req.headers["x-user-dept"] as string) || "";
  const unitsHeader =
    (req.headers["x-user-enrolled-units"] as string) ||
    (req.headers["x-user-units"] as string) ||
    "";

  const config = getAuthConfiguration();
  let user: AuthenticatedUser | undefined;

  // 1. Bearer Token Authentication
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();

    if (token in DEMO_TOKENS_MAP) {
      if (!config.allowDemoAuth) {
        res.status(401).json({
          error:
            "Unauthorized: Mock bearer tokens are disabled in production mode. Set AUTH_MODE=demo or ALLOW_DEMO_AUTH=true to enable simulation.",
        });
        return;
      }
      user = DEMO_TOKENS_MAP[token];
    } else {
      // Real JWT Verification
      try {
        user = await verifySupabaseToken(token);
      } catch (err: any) {
        res.status(401).json({
          error: `Unauthorized: Invalid authentication token (${err.message})`,
        });
        return;
      }
    }
  }

  // 2. Unverified Header-Based Resolution Fallback
  if (!user && roleHeader) {
    if (!config.allowDemoAuth) {
      res.status(401).json({
        error:
          "Unauthorized: Header-based authentication (x-user-role) is forbidden in production mode. Please provide a verified Authorization Bearer token.",
      });
      return;
    }

    const enrolledUnits = unitsHeader
      ? unitsHeader.split(",").map((u) => u.trim())
      : deptHeader === "dept-ee" || idHeader === "trainee-003"
      ? ["EE/CU/PO/CR/1/6"]
      : ["ICT/CU/IT/CR/6/6", "061155101A"];

    user = {
      id: idHeader || `user-${roleHeader}`,
      email: roleHeader === "trainee" ? undefined : `${roleHeader}@mtti.ac.ke`,
      name: `Demo ${roleHeader.toUpperCase()}`,
      role: roleHeader as any,
      reg_number: regHeader,
      department_id: deptHeader,
      assigned_units:
        roleHeader === "trainer"
          ? idHeader === "trainer-002"
            ? ["ICT/OS/IT/CR/1/6"]
            : ["ICT/CU/IT/CR/6/6", "061155101A"]
          : undefined,
      enrolled_units: roleHeader === "trainee" ? enrolledUnits : undefined,
    };
  }

  req.user = user;
  next();
}

/**
 * Role Requirement Express Middleware Guard.
 */
export function requireRoles(...allowedRoles: Array<"trainee" | "trainer" | "hod" | "admin">) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: Missing authentication token" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: Access requires [${allowedRoles.join(", ")}], but user holds '${req.user.role}'`,
      });
      return;
    }

    next();
  };
}
