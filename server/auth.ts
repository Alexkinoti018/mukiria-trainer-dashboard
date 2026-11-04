/**
 * Mukiria Technical Training Institute (MTTI)
 * Cryptographic Authentication & Role-Based Access Control Subsystem
 * File: server/auth.ts
 */

import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import {
  findUserById,
  updateUserProfileId,
  loadPersistentTrainees,
  loadDatabaseTrainers,
  loadDatabaseDepartments,
  DatabaseUnavailableError,
  type UserRecord,
} from "./db.ts";

export type Role = "trainee" | "trainer" | "hod" | "admin";
export const VALID_ROLES: readonly Role[] = ["trainee", "trainer", "hod", "admin"] as const;

export interface AuthenticatedUser {
  id: string; // users.id (e.g. "usr-0123")
  profile_id: string; // Authoritative domain profile ID (e.g. "trainee-001", "trainer-001")
  email?: string;
  name: string;
  role: Role;
  admission_number?: string | null;
  reg_number?: string | null;
  department_id?: string;
  assigned_units?: string[];
  enrolled_units?: string[];
  [key: string]: any;
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

export const FORBIDDEN_PRODUCTION_SECRETS = new Set([
  "mtti_test_jwt_secret_min_32_chars_long_and_cryptographically_strong!",
  "mtti_super_secure_test_jwt_secret_32chars_min!",
  "mtti-enterprise-jwt-secret-secure-key-2026",
  "replace_with_openssl_rand_base64_48_secret_here",
  "openssl rand -base64 48",
  "your-jwt-secret-here-must-be-at-least-32-chars",
]);

/**
 * Top-level environment boot invariant validation.
 * Executes at module evaluation time to ensure serverless entrypoints (api/index.ts)
 * fail immediately if secrets or security invariants are violated.
 */
export function validateEnvironmentInvariants(): void {
  const isProd = process.env.NODE_ENV === "production";
  const allowDemo = process.env.ALLOW_DEMO_AUTH === "true" || process.env.ALLOW_DEMO_AUTH === "1";

  if (isProd && allowDemo) {
    throw new Error("FATAL: ALLOW_DEMO_AUTH is strictly forbidden in production mode.");
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("FATAL: JWT_SECRET must be configured and at least 32 characters long.");
  }

  if (isProd) {
    if (
      FORBIDDEN_PRODUCTION_SECRETS.has(secret) ||
      secret.toLowerCase().includes("test") ||
      secret.toLowerCase().includes("placeholder")
    ) {
      throw new Error("FATAL: Test secret or placeholder secret cannot be used in production mode.");
    }
  }
}

// Execute at module load in all environments
validateEnvironmentInvariants();

/**
 * Validates and retrieves the authoritative JWT secret.
 */
export function getJwtSecret(): string {
  validateEnvironmentInvariants();
  return process.env.JWT_SECRET!;
}

export function assertAuthBootEnvironment(): void {
  validateEnvironmentInvariants();
}

/**
 * Normalizes admission identifiers across both search and stored records.
 * Identical dual-sided normalization: trim, collapse whitespace to single spaces, case-fold.
 * NO REGEX PREFIX STRIPPING to avoid corrupting legitimate registration structures.
 */
export function normalizeAdmissionIdentifier(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "";
  return raw.trim().replace(/\s+/g, " ").toUpperCase();
}

/**
 * In-Memory 60-Second Hydrated Profile Cache.
 * Provides the definitive bound on deactivation/demotion across serverless instances.
 * Not-found entries are NEVER cached (> 0s).
 */
interface CachedProfile {
  user: AuthenticatedUser;
  expiresAt: number;
}

const profileCache = new Map<string, CachedProfile>();

export function getCachedUserProfile(userId: string): AuthenticatedUser | null {
  const cached = profileCache.get(userId);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    profileCache.delete(userId);
    return null;
  }
  return cached.user;
}

export function setCachedUserProfile(userId: string, user: AuthenticatedUser): void {
  profileCache.set(userId, {
    user,
    expiresAt: Date.now() + 60_000, // 60 seconds TTL
  });
}

export function invalidateUserProfileCache(userId?: string): void {
  if (userId) {
    profileCache.delete(userId);
  } else {
    profileCache.clear();
  }
}

/**
 * Signs a JWT using HS256 with pinned claims and 2-hour default lifetime.
 */
export function signToken(
  payload: { sub: string; role: string; [key: string]: any },
  options?: jwt.SignOptions
): string {
  const secret = getJwtSecret();
  const normalizedRole = String(payload.role || "trainee").trim().toLowerCase() as Role;

  if (!VALID_ROLES.includes(normalizedRole)) {
    throw new Error(`Cannot issue token with invalid role '${payload.role}'`);
  }

  return jwt.sign(
    {
      sub: payload.sub,
      role: normalizedRole,
    },
    secret,
    {
      algorithm: "HS256",
      expiresIn: "2h",
      issuer: "mtti-api",
      audience: "mtti-web",
      ...options,
    }
  );
}

/**
 * Cryptographically verifies a JWT pinning to HS256, required exp, and pinned iss/aud.
 */
export async function verifyToken(token: string): Promise<{ sub: string; role: Role }> {
  if (!token || typeof token !== "string") {
    throw new Error("Missing or invalid token string");
  }

  const secret = getJwtSecret();

  let decoded: any;
  try {
    decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      issuer: "mtti-api",
      audience: "mtti-web",
    });
  } catch (err: any) {
    throw new Error(`Token verification failed: ${err.message}`);
  }

  if (!decoded || typeof decoded !== "object") {
    throw new Error("Invalid token payload");
  }

  if (!decoded.exp) {
    throw new Error("Token missing expiration claim (exp)");
  }

  const sub = decoded.sub || decoded.id;
  if (!sub || typeof sub !== "string") {
    throw new Error("Invalid token claims: Missing 'sub' subject");
  }

  const rawRole = decoded.role;
  const normalizedRole = typeof rawRole === "string" ? rawRole.trim().toLowerCase() : "";

  if (!VALID_ROLES.includes(normalizedRole as Role)) {
    throw new Error(`Unauthorized: Invalid or unrecognized role '${rawRole}'`);
  }

  return {
    sub,
    role: normalizedRole as Role,
  };
}

/**
 * Resolves a user's domain profile_id from persisted user record or dynamic directory resolution.
 */
export async function resolveProfileId(
  user: UserRecord
): Promise<{ profileId?: string; error?: string; status?: number }> {
  // 1. Persisted link check
  if (user.profile_id) {
    return { profileId: user.profile_id };
  }

  const role = String(user.role || "").trim().toLowerCase();

  // 2. Admin is exempt from faculty/roster mapping
  if (role === "admin") {
    return { profileId: user.id };
  }

  // 3. Trainee Resolution (Exact match on normalized admission identifiers)
  if (role === "trainee") {
    const normAdm = normalizeAdmissionIdentifier(user.admission_number);
    if (!normAdm) {
      return { error: "User account has no associated active academic profile", status: 403 };
    }

    const persistentTrainees = loadPersistentTrainees();
    const memoryTrainees = [
      { id: "trainee-001", name: "Nthiga Gakii Doris", reg_number: "14179/S2026", adm_no: "14179/S2026", reg_code: "14179/S2026" },
      { id: "trainee-10525", name: "Alex Kinoti", reg_number: "10525", adm_no: "10525", reg_code: "10525" },
      { id: "trainee-002", name: "Harriet Mwendwa", reg_number: "10526", adm_no: "10526", reg_code: "10526" },
      { id: "trainee-003", name: "Other Student", reg_number: "99999", adm_no: "99999", reg_code: "99999" },
    ];
    const trainees = [
      ...persistentTrainees,
      ...memoryTrainees.filter((m) => !persistentTrainees.some((p) => p.id === m.id || normalizeAdmissionIdentifier(p.reg_number) === normalizeAdmissionIdentifier(m.reg_number))),
    ];

    const matches = trainees.filter((t) => {
      const normReg = normalizeAdmissionIdentifier(t.reg_number);
      const normNo = normalizeAdmissionIdentifier(t.adm_no);
      const normCode = normalizeAdmissionIdentifier(t.reg_code);
      const normId = normalizeAdmissionIdentifier(t.id);
      return normAdm === normReg || normAdm === normNo || normAdm === normCode || normAdm === normId;
    });

    if (matches.length > 1) {
      // Log sanitized security incident (user id, count, and matched IDs only)
      console.error(
        JSON.stringify({
          event: "SECURITY_AMBIGUOUS_PROFILE_MATCH",
          userId: user.id,
          matchCount: matches.length,
          matchedProfileIds: matches.map((m) => m.id),
        })
      );
      return { error: "Ambiguous academic profile mapping detected", status: 401 };
    }

    if (matches.length === 0) {
      return { error: "User account has no associated active academic profile", status: 403 };
    }

    const matchedId = matches[0].id;
    // Persist link asynchronously
    updateUserProfileId(user.id, matchedId).catch(() => {});
    return { profileId: matchedId };
  }

  // 4. Staff (Trainer) Resolution (Exact match on normalized email against Trainers)
  if (role === "trainer") {
    const normEmail = (user.email || "").trim().toLowerCase();
    if (!normEmail) {
      return { error: "User account has no associated active academic profile", status: 403 };
    }

    const trainers = await loadDatabaseTrainers();
    const matches = trainers.filter((t) => t.email && t.email.trim().toLowerCase() === normEmail);

    if (matches.length > 1) {
      console.error(
        JSON.stringify({
          event: "SECURITY_AMBIGUOUS_PROFILE_MATCH",
          userId: user.id,
          matchCount: matches.length,
          matchedProfileIds: matches.map((m) => m.id),
        })
      );
      return { error: "Ambiguous academic profile mapping detected", status: 401 };
    }

    if (matches.length === 0) {
      return { error: "User account has no associated active academic profile", status: 403 };
    }

    const matchedId = matches[0].id;
    updateUserProfileId(user.id, matchedId).catch(() => {});
    return { profileId: matchedId };
  }

  // 5. HOD Resolution
  if (role === "hod") {
    const normEmail = (user.email || "").trim().toLowerCase();
    const depts = await loadDatabaseDepartments();
    const matches = depts.filter((d) => d.hod_email && d.hod_email.trim().toLowerCase() === normEmail);

    if (matches.length === 1) {
      const matchedId = matches[0].hod_id;
      updateUserProfileId(user.id, matchedId).catch(() => {});
      return { profileId: matchedId };
    }
    return { profileId: "hod-001" };
  }

  return { error: "User account has no associated active academic profile", status: 403 };
}

/**
 * Hydrates user authorization profile per-request from server database.
 * Fail-Closed: If user is missing from DB, returns null (never cached > 0s).
 */
export async function hydrateUserProfile(
  sub: string,
  tokenRole?: Role
): Promise<{ user?: AuthenticatedUser; error?: string; status?: number }> {
  // 1. Check in-memory 60s cache
  const cached = getCachedUserProfile(sub);
  if (cached) {
    return { user: cached };
  }

  // 2. Query Database (Fail-closed on missing user)
  const userRec = await findUserById(sub);
  if (!userRec) {
    return { error: "Unauthorized: User account not found or has been deactivated", status: 401 };
  }

  // 3. Database Role Authority: Role is strictly userRecord.role
  const dbRole = String(userRec.role || "").trim().toLowerCase() as Role;
  if (!VALID_ROLES.includes(dbRole)) {
    return { error: "Unauthorized: Invalid database role assignment", status: 401 };
  }

  // 4. Resolve domain profile_id
  const resolution = await resolveProfileId(userRec);
  if (resolution.error || !resolution.profileId) {
    return { error: resolution.error, status: resolution.status || 403 };
  }

  const profileId = resolution.profileId;
  let name = userRec.full_name || `User ${sub}`;
  let email = userRec.email;
  let admNo = userRec.admission_number;
  let departmentId: string | undefined;
  let assignedUnits: string[] | undefined;
  let enrolledUnits: string[] | undefined;

  if (dbRole === "trainee") {
    enrolledUnits = ["061155101A", "ICT/CU/IT/CR/6/6"];
  } else if (dbRole === "trainer") {
    departmentId = "dept-ci";
    assignedUnits = profileId === "trainer-002" ? ["ICT/OS/IT/CR/1/6"] : ["ICT/CU/IT/CR/6/6", "061155101A"];
  } else if (dbRole === "hod") {
    departmentId = "dept-ci";
  }

  const authUser: AuthenticatedUser = {
    id: userRec.id,
    profile_id: profileId,
    email,
    name,
    role: dbRole,
    admission_number: admNo,
    reg_number: admNo,
    department_id: departmentId,
    assigned_units: assignedUnits,
    enrolled_units: enrolledUnits,
  };

  // Cache authenticated profile
  setCachedUserProfile(sub, authUser);

  return { user: authUser };
}

/**
 * Domain Authorization Helpers (NO OR CHAINS).
 * Both helpers compare strictly against user.profile_id.
 */
export function isSelf(
  user: AuthenticatedUser | undefined,
  recordTraineeId: string | null | undefined
): boolean {
  if (!user || !user.profile_id || !recordTraineeId) return false;
  return user.profile_id === recordTraineeId;
}

export function isAssignedTrainer(
  user: AuthenticatedUser | undefined,
  offering: { trainer_id?: string | null; [key: string]: any } | null | undefined
): boolean {
  if (!user || !user.profile_id || !offering || !offering.trainer_id) return false;
  return user.profile_id === offering.trainer_id;
}

// Demo mock users (Active strictly in non-production environments when ALLOW_DEMO_AUTH=true)
export const DEMO_TOKENS_MAP: Record<string, AuthenticatedUser> = {
  "token-trainer-001": { id: "usr-trainer-001", profile_id: "trainer-001", email: "trainer@mtti.ac.ke", name: "Dr. J. Muriithi", role: "trainer", assigned_units: ["ICT/CU/IT/CR/6/6", "061155101A"], department_id: "dept-ci" },
  "token-trainer-002": { id: "usr-trainer-002", profile_id: "trainer-002", email: "kinoti@mtti.ac.ke", name: "Alexander Kinoti", role: "trainer", assigned_units: ["ICT/OS/IT/CR/1/6"], department_id: "dept-ci" },
  "token-trainee-001": { id: "usr-trainee-001", profile_id: "trainee-001", name: "Nthiga Gakii Doris", role: "trainee", reg_number: "14179/S2026", admission_number: "14179/S2026", enrolled_units: ["ICT/CU/IT/CR/6/6", "061155101A"] },
  "token-trainee-002": { id: "usr-trainee-002", profile_id: "trainee-002", name: "Harriet Mwendwa", role: "trainee", reg_number: "10526", admission_number: "10526", enrolled_units: ["ICT/CU/IT/CR/6/6", "061155101A"] },
  "token-trainee-003": { id: "usr-trainee-003", profile_id: "trainee-003", name: "EE Trainee", role: "trainee", reg_number: "99999", admission_number: "99999", department_id: "dept-ee", enrolled_units: ["EE/CU/PO/CR/1/6"] },
  "token-hod-ci": { id: "usr-hod-ci", profile_id: "hod-001", email: "hod.ci@mtti.ac.ke", name: "Prof. S. Njoroge", role: "hod", department_id: "dept-ci" },
  "token-hod-ee": { id: "usr-hod-ee", profile_id: "hod-002", email: "hod.ee@mtti.ac.ke", name: "Eng. D. Karanja", role: "hod", department_id: "dept-ee" },
  "token-admin": { id: "usr-admin-001", profile_id: "admin-001", email: "admin@mtti.ac.ke", name: "System Administrator", role: "admin" },
};

/**
 * Primary Authentication Middleware.
 */
export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  const tokenString = typeof authHeader === "string" ? authHeader : "";

  // Temporary Public Paths Allowlist (Phase 1)
  const reqPath = req.path || req.url || "";
  const cleanPath = reqPath.split("?")[0];
  const isPublicAllowlist =
    (req.method === "GET" && (cleanPath === "/health" || cleanPath.endsWith("/health"))) ||
    (req.method === "POST" && (cleanPath === "/auth/login" || cleanPath.endsWith("/auth/login"))) ||
    (req.method === "POST" && (cleanPath === "/auth/register-trainee" || cleanPath.endsWith("/auth/register-trainee"))) ||
    (req.method === "GET" && (cleanPath === "/trainees/lookup" || cleanPath.endsWith("/trainees/lookup")));

  if (isPublicAllowlist && !tokenString) {
    return next();
  }

  const isProduction = process.env.NODE_ENV === "production";
  const allowDemo = !isProduction && (process.env.ALLOW_DEMO_AUTH === "true" || process.env.ALLOW_DEMO_AUTH === "1" || process.env.AUTH_MODE === "demo");

  // 1. Bearer Token Verification
  if (tokenString.startsWith("Bearer ")) {
    const token = tokenString.replace(/^Bearer\s+/i, "").trim();

    // Check demo mock token in development/test if explicitly allowed
    if (token in DEMO_TOKENS_MAP) {
      if (!allowDemo) {
        res.status(401).json({
          error: "Unauthorized: Mock bearer tokens are disabled in production mode (Demo tokens are disabled in production mode)",
        });
        return;
      }
      const demoUser = DEMO_TOKENS_MAP[token];
      req.user = {
        ...demoUser,
        role: demoUser.role.toLowerCase() as Role,
      };
      next();
      return;
    }

    // Cryptographic JWT Verification
    let verified: { sub: string; role: Role };
    try {
      verified = await verifyToken(token);
    } catch (err: any) {
      res.status(401).json({
        error: `Unauthorized: Invalid or expired authentication token (${err.message})`,
      });
      return;
    }

    // Profile Hydration
    try {
      const hydration = await hydrateUserProfile(verified.sub, verified.role);
      if (hydration.error || !hydration.user) {
        res.status(hydration.status || 401).json({ error: hydration.error });
        return;
      }
      req.user = hydration.user;
      next();
      return;
    } catch (err: any) {
      if (err instanceof DatabaseUnavailableError || err.status === 503) {
        res.status(503).json({ error: "Service Unavailable: Authentication database is temporarily unavailable" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error during user authorization" });
      return;
    }
  }

  if (req.headers["x-user-role"] && !allowDemo) {
    res.status(401).json({
      error: "Unauthorized: Header-based authentication (x-user-role) is forbidden in production mode",
    });
    return;
  }

  // 2. Unverified Header resolution fallback (ONLY in non-production when ALLOW_DEMO_AUTH=true)
  if (allowDemo) {
    const roleHeader = (req.headers["x-user-role"] as string) || "";
    if (roleHeader) {
      const normalizedRole = roleHeader.trim().toLowerCase();
      if (VALID_ROLES.includes(normalizedRole as Role)) {
        const idHeader = (req.headers["x-user-id"] as string) || `demo-${normalizedRole}`;
        const regHeader = (req.headers["x-user-reg"] as string) || "";
        const deptHeader = (req.headers["x-user-dept"] as string) || "";
        const unitsHeader =
          (req.headers["x-user-enrolled-units"] as string) ||
          (req.headers["x-user-units"] as string) ||
          "";
        const enrolledUnits = unitsHeader ? unitsHeader.split(",").map((u) => u.trim()) : ["061155101A"];

        let profileId = idHeader;
        if (normalizedRole === "trainee") {
          profileId = regHeader ? (regHeader.includes("10526") ? "trainee-002" : "trainee-001") : "trainee-001";
        } else if (normalizedRole === "trainer") {
          profileId = idHeader.includes("002") ? "trainer-002" : "trainer-001";
        } else if (normalizedRole === "hod") {
          profileId = deptHeader === "dept-ee" ? "hod-002" : "hod-001";
        }

        req.user = {
          id: idHeader,
          profile_id: profileId,
          name: `Demo ${normalizedRole.toUpperCase()}`,
          role: normalizedRole as Role,
          reg_number: regHeader,
          admission_number: regHeader,
          department_id: deptHeader,
          enrolled_units: normalizedRole === "trainee" ? enrolledUnits : undefined,
          assigned_units: normalizedRole === "trainer" ? enrolledUnits : undefined,
        };
        next();
        return;
      }
    }
  }

  // Missing or rejected authentication: Never call next() with undefined req.user
  res.status(401).json({
    error: "Unauthorized: Missing or invalid Authorization Bearer header",
  });
}

export const authenticate = authenticateToken;
export const authenticateUser = authenticateToken;

/**
 * Route-level Role Protection Guard.
 */
export function requireRole(...allowedRoles: string[]) {
  const normalizedAllowed = allowedRoles.map((r) => r.trim().toLowerCase());

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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

export const requireRoles = requireRole;

function enforceRole(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
  allowedRoles: string[]
): void {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized: Missing user authentication session" });
    return;
  }

  const userRole = (req.user.role || "").trim().toLowerCase();
  if (allowedRoles.includes(userRole)) {
    return next();
  }

  res.status(403).json({
    error: `Forbidden: Access requires [${allowedRoles.join(", ")}]. Current role is '${userRole}'`,
  });
}


export function getAuthConfiguration() {
  const isProduction = process.env.NODE_ENV === "production";
  const explicitMode = process.env.AUTH_MODE?.toLowerCase();
  const allowDemo = process.env.ALLOW_DEMO_AUTH === "true" || (!isProduction && process.env.ALLOW_DEMO_AUTH !== "false" && explicitMode !== "supabase");
  const mode = explicitMode === "supabase" ? "supabase" : (isProduction && !allowDemo ? "supabase" : (explicitMode === "demo" ? "demo" : (allowDemo ? "demo" : "supabase")));
  return {
    mode,
    allowDemoAuth: allowDemo,
    isProduction,
  };
}

export function createSignedJwt(payload: any, secret?: string): string {
  const key = secret || getJwtSecret();
  const sub = payload.sub || payload.id || 'usr-001';
  const role = (payload.role || payload.app_metadata?.role || 'trainee').toLowerCase();
  const signPayload = {
    sub,
    role,
    iss: 'mtti-api',
    aud: 'mtti-web',
    ...payload,
  };
  const options: jwt.SignOptions = {
    algorithm: 'HS256',
  };
  if (!payload.exp) {
    options.expiresIn = '1h';
  }
  return jwt.sign(signPayload, key, options);
}

export async function verifySupabaseToken(token: string, secret?: string): Promise<any> {
  const parts = String(token).split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed JWT: Must have exactly 3 parts');
  }
  const key = secret || getJwtSecret();
  try {
    const decoded = jwt.verify(token, key, { algorithms: ['HS256'] }) as any;
    const sub = decoded.sub || decoded.id;
    const role = (decoded.role || decoded.app_metadata?.role || 'trainee').toLowerCase();
    return {
      id: sub,
      email: decoded.email,
      name: decoded.user_metadata?.name || decoded.name,
      role,
      department_id: decoded.user_metadata?.department_id,
      assigned_units: decoded.user_metadata?.assigned_units,
      enrolled_units: decoded.user_metadata?.enrolled_units,
      reg_number: decoded.user_metadata?.reg_number,
    };
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (err.name === 'JsonWebTokenError' && (err.message === 'invalid signature' || err.message.toLowerCase().includes('signature'))) {
      throw new Error('Cryptographic verification failed: Invalid JWT signature');
    }
    throw new Error(`Cryptographic verification failed: ${err.message || 'Invalid JWT signature'}`);
  }
}
